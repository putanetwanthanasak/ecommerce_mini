import { Router } from "express";
import { z } from "zod";
import { prisma } from "../lib/prisma";
import { requireAuth, requireAdmin } from "../middleware/auth";

const router = Router();

// Price is Decimal(10,2) in the schema — anything finer would be silently rounded by the DB
const priceSchema = z
  .number()
  .positive("Price must be greater than 0")
  .refine((v) => (v.toString().split(".")[1]?.length ?? 0) <= 2, {
    message: "Price cannot have more than 2 decimal places",
  });

const productSchema = z.object({
  name: z.string().trim().min(1, "Name is required"),
  description: z.string().optional(),
  price: priceSchema,
  stock: z.number().int("Stock must be a whole number").min(0, "Stock cannot be negative"),
  categoryId: z.string().uuid("categoryId must be a valid UUID"),
});

// Partial update — same rules, but every field optional.
// description is nullable here so a client can explicitly clear it.
const updateProductSchema = productSchema
  .partial()
  .extend({ description: z.string().nullable().optional() });

const listQuerySchema = z.object({
  page: z.coerce.number().int().positive("page must be a positive integer").default(1),
  // Cap rather than reject: ?limit=500 is a reasonable ask for "as many as you'll give me"
  limit: z.coerce
    .number()
    .int()
    .positive("limit must be a positive integer")
    .transform((v) => Math.min(v, 100))
    .default(20),
  categoryId: z.string().uuid("categoryId must be a valid UUID").optional(),
  search: z.string().trim().min(1).optional(),
});

// POST /api/products
router.post("/", requireAuth, requireAdmin, async (req, res, next) => {
  try {
    const data = productSchema.parse(req.body);

    // Check the FK ourselves so a bad categoryId is a clean 404, not a raw Prisma error
    const category = await prisma.category.findUnique({ where: { id: data.categoryId } });
    if (!category) {
      return res.status(404).json({ error: "Category not found" });
    }

    const product = await prisma.product.create({
      data,
      include: { category: { select: { id: true, name: true } } },
    });

    res.status(201).json({ product });
  } catch (err) {
    next(err);
  }
});

// GET /api/products — public, paginated
router.get("/", async (req, res, next) => {
  try {
    const { page, limit, categoryId, search } = listQuerySchema.parse(req.query);

    const where = {
      ...(categoryId ? { categoryId } : {}),
      ...(search ? { name: { contains: search, mode: "insensitive" as const } } : {}),
    };

    const [products, total] = await Promise.all([
      prisma.product.findMany({
        where,
        orderBy: { createdAt: "desc" },
        skip: (page - 1) * limit,
        take: limit,
        include: { category: { select: { id: true, name: true } } },
      }),
      prisma.product.count({ where }),
    ]);

    res.json({
      products,
      pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
    });
  } catch (err) {
    next(err);
  }
});

// GET /api/products/:id — public
router.get("/:id", async (req, res, next) => {
  try {
    // Express 5 types params as string | string[]; this route only ever has one :id
    const { id } = req.params as { id: string };

    const product = await prisma.product.findUnique({
      where: { id },
      include: { category: true },
    });
    if (!product) {
      return res.status(404).json({ error: "Product not found" });
    }

    res.json({ product });
  } catch (err) {
    next(err);
  }
});

// PATCH /api/products/:id
router.patch("/:id", requireAuth, requireAdmin, async (req, res, next) => {
  try {
    const { id } = req.params as { id: string };
    const data = updateProductSchema.parse(req.body);

    const existing = await prisma.product.findUnique({ where: { id } });
    if (!existing) {
      return res.status(404).json({ error: "Product not found" });
    }

    if (data.categoryId) {
      const category = await prisma.category.findUnique({ where: { id: data.categoryId } });
      if (!category) {
        return res.status(404).json({ error: "Category not found" });
      }
    }

    const product = await prisma.product.update({
      where: { id },
      data,
      include: { category: { select: { id: true, name: true } } },
    });

    res.json({ product });
  } catch (err) {
    next(err);
  }
});

// DELETE /api/products/:id
router.delete("/:id", requireAuth, requireAdmin, async (req, res, next) => {
  try {
    const { id } = req.params as { id: string };

    const product = await prisma.product.findUnique({ where: { id } });
    if (!product) {
      return res.status(404).json({ error: "Product not found" });
    }

    // Order items keep a historical reference to the product — deleting would break past orders
    const orderItemCount = await prisma.orderItem.count({ where: { productId: id } });
    if (orderItemCount > 0) {
      return res.status(409).json({ error: "Cannot delete a product that has existing orders" });
    }

    await prisma.product.delete({ where: { id } });

    res.json({ message: "Product deleted" });
  } catch (err) {
    next(err);
  }
});

export default router;
