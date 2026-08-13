import { describe, it, expect, beforeAll, afterEach, afterAll } from "vitest";
import request from "supertest";
import app from "../app";
import { prisma } from "../lib/prisma";
import { createUser, createCategory, createProduct, destroyFixtures, getStock, TestUser } from "./helpers";

let customerA: TestUser;
let customerB: TestUser;
let admin: TestUser;
let categoryId: string;

const productIds: string[] = [];

beforeAll(async () => {
  [customerA, customerB, admin, categoryId] = await Promise.all([
    createUser("CUSTOMER"),
    createUser("CUSTOMER"),
    createUser("ADMIN"),
    createCategory("orders-test"),
  ]);
});

// Orders and their line items are torn down after every test so stock assertions
// in one test can never be reading another test's leftovers.
afterEach(async () => {
  const userIds = [customerA.id, customerB.id, admin.id];
  await prisma.orderItem.deleteMany({
    where: { OR: [{ productId: { in: productIds } }, { order: { userId: { in: userIds } } }] },
  });
  await prisma.order.deleteMany({ where: { userId: { in: userIds } } });
  await prisma.product.deleteMany({ where: { id: { in: productIds } } });
  productIds.length = 0;
});

afterAll(async () => {
  await destroyFixtures({
    userIds: [customerA.id, customerB.id, admin.id],
    categoryIds: [categoryId],
  });
  await prisma.$disconnect();
});

async function seedProduct(stock: number, price: number | string = 39.99) {
  const id = await createProduct({ categoryId, price, stock });
  productIds.push(id);
  return id;
}

function placeOrder(user: TestUser, productId: string, quantity: number) {
  return request(app)
    .post("/api/orders")
    .set("Authorization", `Bearer ${user.token}`)
    .send({ items: [{ productId, quantity }] });
}

describe("POST /api/orders", () => {
  it("rejects an order larger than available stock and leaves stock untouched", async () => {
    const productId = await seedProduct(3);
    const before = await getStock(productId);

    const res = await placeOrder(customerA, productId, 5);

    expect(res.status).toBe(409);
    // The status alone would still pass if the transaction had decremented and
    // failed to roll back — the real assertion is that the row is unchanged.
    expect(await getStock(productId)).toBe(before);
    expect(before).toBe(3);
  });

  it("creates the order, decrements stock exactly, and snapshots the price", async () => {
    const productId = await seedProduct(10, 39.99);

    const res = await placeOrder(customerA, productId, 4);

    expect(res.status).toBe(201);
    expect(await getStock(productId)).toBe(6);

    const [item] = res.body.order.items;
    expect(item.quantity).toBe(4);
    // Decimal serializes as a string — compare numerically, not by identity.
    expect(Number(item.priceAtPurchase)).toBe(39.99);
    expect(Number(res.body.order.totalPrice)).toBe(159.96);
  });

  it("never oversells under concurrency: two requests for the last unit", async () => {
    // The single most important behavior in the codebase. Stock is folded into
    // the WHERE clause of the decrement (see the comment in routes/orders.ts), so
    // the loser matches zero rows and rolls back. A plain read-then-write would
    // let both succeed and drive stock to -1.
    const productId = await seedProduct(1);

    const [first, second] = await Promise.all([
      placeOrder(customerA, productId, 1),
      placeOrder(customerB, productId, 1),
    ]);

    const statuses = [first.status, second.status].sort();
    expect(statuses).toEqual([201, 409]);

    const finalStock = await getStock(productId);
    expect(finalStock).toBe(0);
    expect(finalStock).toBeGreaterThanOrEqual(0);

    const orderCount = await prisma.order.count({
      where: { userId: { in: [customerA.id, customerB.id] } },
    });
    expect(orderCount).toBe(1);
  });
});

describe("GET /api/orders/:id", () => {
  it("returns 403 when another customer requests the order", async () => {
    const productId = await seedProduct(5);
    const created = await placeOrder(customerA, productId, 1);
    expect(created.status).toBe(201);

    const res = await request(app)
      .get(`/api/orders/${created.body.order.id}`)
      .set("Authorization", `Bearer ${customerB.token}`);

    // 403, not 404 — customerB is authenticated, the order just isn't theirs.
    expect(res.status).toBe(403);
  });
});

describe("PATCH /api/orders/:id/status", () => {
  it("restores stock on cancel and does not restore twice on a repeat cancel", async () => {
    const productId = await seedProduct(10);

    const created = await placeOrder(customerA, productId, 3);
    expect(created.status).toBe(201);
    expect(await getStock(productId)).toBe(7);

    const orderId = created.body.order.id;
    const cancel = () =>
      request(app)
        .patch(`/api/orders/${orderId}/status`)
        .set("Authorization", `Bearer ${admin.token}`)
        .send({ status: "CANCELLED" });

    const first = await cancel();
    expect(first.status).toBe(200);
    expect(first.body.order.status).toBe("CANCELLED");
    expect(await getStock(productId)).toBe(10);

    // Cancelling an already-cancelled order is a no-op, not a second restock —
    // otherwise a repeated request would invent stock that was never sold.
    const second = await cancel();
    expect(second.status).toBe(200);
    expect(second.body.order.status).toBe("CANCELLED");
    expect(await getStock(productId)).toBe(10);
  });
});
