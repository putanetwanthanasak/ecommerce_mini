import { Router } from "express";
import { Prisma } from "@prisma/client";
import { z } from "zod";
import { prisma } from "../lib/prisma";
import { requireAuth, requireAdmin } from "../middleware/auth";
import { HttpError } from "../utils/httpError";

const router = Router();

const createOrderSchema = z.object({
  // Note there is no `price` field here on purpose — see the comment in POST /.
  items: z
    .array(
      z.object({
        productId: z.string().uuid("productId must be a valid UUID"),
        quantity: z.number().int("quantity must be a whole number").positive("quantity must be greater than 0"),
      })
    )
    .min(1, "An order must contain at least one item"),
});

const statusSchema = z.object({
  status: z.enum(["PENDING", "PAID", "SHIPPED", "CANCELLED"]),
});

const listQuerySchema = z.object({
  page: z.coerce.number().int().positive("page must be a positive integer").default(1),
  limit: z.coerce
    .number()
    .int()
    .positive("limit must be a positive integer")
    .transform((v) => Math.min(v, 100))
    .default(20),
  userId: z.string().uuid("userId must be a valid UUID").optional(),
});

// Every order response carries its line items with the product name attached,
// so a client can render an order without a second round trip per item.
const orderInclude = {
  items: {
    include: { product: { select: { id: true, name: true, price: true } } },
  },
} satisfies Prisma.OrderInclude;

// POST /api/orders — any authenticated user places an order for themselves
router.post("/", requireAuth, async (req, res, next) => {
  try {
    const { items } = createOrderSchema.parse(req.body);
    const userId = req.user!.userId;

    const order = await prisma.$transaction(
      async (tx) => {
        const lineItems: Prisma.OrderItemCreateWithoutOrderInput[] = [];
        let totalPrice = new Prisma.Decimal(0);

        // Always take the row locks in the same order, no matter what order the
        // client listed the items in. Two concurrent orders for products A and B
        // submitted as [A, B] and [B, A] would otherwise each grab one row and then
        // wait on the other — a deadlock. Postgres detects it after ~1s and kills one
        // transaction, which would surface to the client as a 500. Sorting by a stable
        // key makes lock acquisition globally consistent, so the second order simply
        // queues behind the first instead of forming a cycle.
        const orderedItems = [...items].sort((a, b) => a.productId.localeCompare(b.productId));

        for (const item of orderedItems) {
          // Read inside the transaction, not before it. A product fetched before
          // BEGIN could already be stale by the time we write.
          const product = await tx.product.findUnique({ where: { id: item.productId } });
          if (!product) {
            // Throwing (rather than returning a response) is what rolls back every
            // stock decrement already applied earlier in this loop. A mixed
            // valid/invalid item list must not leave the valid item's stock reduced.
            throw new HttpError(404, `Product ${item.productId} not found`);
          }
          if (product.stock < item.quantity) {
            throw new HttpError(409, `Insufficient stock for ${product.name}`);
          }

          // WHY THIS IS AN updateMany WITH A `stock >= quantity` GUARD, AND NOT A
          // PLAIN update:
          //
          // The transaction alone does NOT stop two racing orders from overselling.
          // Prisma's default isolation on Postgres is READ COMMITTED. Given stock=1
          // and two concurrent requests for quantity=1:
          //
          //   T1  BEGIN; SELECT stock -> 1; passes the check above
          //   T2  BEGIN; SELECT stock -> 1; passes the check too (T1 hasn't committed,
          //       so T2 still reads the last committed value)
          //   T1  UPDATE ... stock = stock - 1  -> 0, takes the row lock
          //   T2  UPDATE ... stock = stock - 1  -> blocks, then on T1's commit
          //       RE-READS the row at its new value and applies -1  ->  -1
          //
          // Both commit, stock is -1, one unit sold twice. The check above is a
          // read that goes stale the moment another transaction writes.
          //
          // Folding the condition INTO the write closes the window: the row lock and
          // the predicate are evaluated together, atomically, on the current version
          // of the row. The loser matches 0 rows and gets rolled back. This is safe
          // under READ COMMITTED, so it needs no isolation-level bump and no retry
          // loop. The findUnique above still earns its place — it produces the 404
          // and supplies the name and price — but it is not what makes this correct.
          const claimed = await tx.product.updateMany({
            where: { id: item.productId, stock: { gte: item.quantity } },
            data: { stock: { decrement: item.quantity } },
          });
          if (claimed.count === 0) {
            // Lost the race: stock was sufficient when we read it, not when we wrote.
            throw new HttpError(409, `Insufficient stock for ${product.name}`);
          }

          // Price is taken from the row we just read, never from the request body —
          // otherwise a client could name its own price. It is snapshotted onto the
          // line item because product.price is free to change afterwards.
          const priceAtPurchase = product.price;
          totalPrice = totalPrice.add(priceAtPurchase.mul(item.quantity));

          lineItems.push({
            product: { connect: { id: item.productId } },
            quantity: item.quantity,
            priceAtPurchase,
          });
        }

        return tx.order.create({
          data: {
            user: { connect: { id: userId } },
            status: "PENDING",
            totalPrice,
            items: { create: lineItems },
          },
          include: orderInclude,
        });
      },
      // A multi-item order does several round trips and may sit waiting on a row
      // lock held by a racing order; the 5s default is tight for that.
      //
      // maxWait is how long a request queues for a free connection before giving up.
      // Each order holds its connection across several round trips, so under a burst
      // the queue outlasts the 2s default and callers get a confusing P2028 "unable to
      // start a transaction" — a saturated pool, not anything wrong with the order.
      { timeout: 15000, maxWait: 10000 }
    );

    res.status(201).json({ order });
  } catch (err) {
    next(err);
  }
});

// GET /api/orders — customers see their own orders, admins see everyone's
router.get("/", requireAuth, async (req, res, next) => {
  try {
    const { page, limit, userId } = listQuerySchema.parse(req.query);
    const isAdmin = req.user!.role === "ADMIN";

    // A customer's scope is pinned to their own id. The ?userId= filter is honoured
    // only for admins — for a customer it is ignored rather than rejected, so it can
    // never widen what they can see.
    const where: Prisma.OrderWhereInput = isAdmin
      ? { ...(userId ? { userId } : {}) }
      : { userId: req.user!.userId };

    const [orders, total] = await Promise.all([
      prisma.order.findMany({
        where,
        orderBy: { createdAt: "desc" },
        skip: (page - 1) * limit,
        take: limit,
        include: orderInclude,
      }),
      prisma.order.count({ where }),
    ]);

    res.json({
      orders,
      pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
    });
  } catch (err) {
    next(err);
  }
});

// GET /api/orders/:id
router.get("/:id", requireAuth, async (req, res, next) => {
  try {
    // Express 5 types params as string | string[]; this route only ever has one :id
    const { id } = req.params as { id: string };

    const order = await prisma.order.findUnique({
      where: { id },
      include: orderInclude,
    });
    if (!order) {
      return res.status(404).json({ error: "Order not found" });
    }

    if (order.userId !== req.user!.userId && req.user!.role !== "ADMIN") {
      // 403 rather than 404: an order id is a uuid, so it isn't guessable and
      // confirming existence tells an attacker nothing useful. The body carries no
      // detail about the order itself.
      return res.status(403).json({ error: "You don't have access to this order" });
    }

    res.json({ order });
  } catch (err) {
    next(err);
  }
});

// PATCH /api/orders/:id/status — admin only
router.patch("/:id/status", requireAuth, requireAdmin, async (req, res, next) => {
  try {
    const { id } = req.params as { id: string };
    const { status } = statusSchema.parse(req.body);

    const existing = await prisma.order.findUnique({
      where: { id },
      include: { items: true },
    });
    if (!existing) {
      return res.status(404).json({ error: "Order not found" });
    }

    // CANCELLED is terminal. Its stock has already been returned to the shelf, so
    // reviving the order would hand the customer goods that were never re-reserved —
    // a silent oversell. Re-cancelling is still allowed and handled below as a no-op.
    if (existing.status === "CANCELLED" && status !== "CANCELLED") {
      return res.status(409).json({ error: "Cannot change status of a cancelled order" });
    }

    // Cancelling a live order restocks it. The `existing.status !== "CANCELLED"` arm
    // is what keeps a repeat cancel from restocking every line item a second time and
    // inventing stock from nothing.
    if (status === "CANCELLED" && existing.status !== "CANCELLED") {
      const order = await prisma.$transaction(async (tx) => {
        // Same global lock ordering as POST / — a cancel and a new order can contend
        // for the same product rows, so both paths must walk them in one agreed order.
        const restock = [...existing.items].sort((a, b) => a.productId.localeCompare(b.productId));

        for (const item of restock) {
          await tx.product.update({
            where: { id: item.productId },
            data: { stock: { increment: item.quantity } },
          });
        }

        // Re-check the status inside the transaction and only move rows that are
        // still un-cancelled. Two concurrent cancels both pass the check above; the
        // second one matches nothing here and its restock rolls back with it.
        const moved = await tx.order.updateMany({
          where: { id, status: { not: "CANCELLED" } },
          data: { status: "CANCELLED" },
        });
        if (moved.count === 0) {
          throw new HttpError(409, "Order was cancelled by another request");
        }

        return tx.order.findUniqueOrThrow({ where: { id }, include: orderInclude });
      });

      return res.json({ order });
    }

    const order = await prisma.order.update({
      where: { id },
      data: { status },
      include: orderInclude,
    });

    res.json({ order });
  } catch (err) {
    next(err);
  }
});

export default router;
