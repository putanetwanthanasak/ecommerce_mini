import { describe, it, expect, beforeAll, afterEach, afterAll } from "vitest";
import request from "supertest";
import app from "../app";
import { prisma } from "../lib/prisma";
import { createUser, createCategory, createProduct, destroyFixtures, unique, TestUser } from "./helpers";

let admin: TestUser;
let customer: TestUser;
let categoryId: string;

// Products created inside a test, cleaned up after it so the suite is repeatable.
const productIds: string[] = [];

beforeAll(async () => {
  [admin, customer, categoryId] = await Promise.all([
    createUser("ADMIN"),
    createUser("CUSTOMER"),
    createCategory("products-test"),
  ]);
});

afterEach(async () => {
  if (productIds.length === 0) return;
  await prisma.product.deleteMany({ where: { id: { in: productIds } } });
  productIds.length = 0;
});

afterAll(async () => {
  await destroyFixtures({ userIds: [admin.id, customer.id], categoryIds: [categoryId] });
  await prisma.$disconnect();
});

function validProduct() {
  return { name: unique("Widget"), price: 19.99, stock: 5, categoryId };
}

describe("POST /api/products", () => {
  it("creates a product as an admin", async () => {
    const body = validProduct();
    const res = await request(app)
      .post("/api/products")
      .set("Authorization", `Bearer ${admin.token}`)
      .send(body);

    if (res.body?.product?.id) productIds.push(res.body.product.id);

    expect(res.status).toBe(201);
    expect(res.body.product).toMatchObject({ name: body.name, stock: 5 });
    expect(Number(res.body.product.price)).toBe(19.99);
  });

  it("returns 403 for an authenticated non-admin", async () => {
    const res = await request(app)
      .post("/api/products")
      .set("Authorization", `Bearer ${customer.token}`)
      .send(validProduct());

    // 403, not 401 — the customer is authenticated, they just aren't allowed.
    expect(res.status).toBe(403);
  });

  it("returns 401 without a token", async () => {
    const res = await request(app).post("/api/products").send(validProduct());

    expect(res.status).toBe(401);
  });

  it("returns 400 for a negative price", async () => {
    const res = await request(app)
      .post("/api/products")
      .set("Authorization", `Bearer ${admin.token}`)
      .send({ ...validProduct(), price: -5 });

    expect(res.status).toBe(400);
    expect(res.body.error).toBe("Validation failed");
  });
});

describe("GET /api/products", () => {
  it("defaults to page 1 with a limit of 20", async () => {
    const res = await request(app).get("/api/products");

    expect(res.status).toBe(200);
    expect(res.body.pagination).toMatchObject({ page: 1, limit: 20 });
    expect(res.body.products.length).toBeLessThanOrEqual(20);
  });

  it("matches ?search= case-insensitively", async () => {
    const token = unique("Zestful");
    const id = await createProduct({
      categoryId,
      price: 5.0,
      stock: 1,
      name: `Deluxe ${token} Lamp`,
    });
    productIds.push(id);

    const res = await request(app).get("/api/products").query({ search: token.toLowerCase() });

    expect(res.status).toBe(200);
    expect(res.body.products.map((p: { id: string }) => p.id)).toContain(id);
  });

  it("clamps ?limit=500 to 100 instead of erroring", async () => {
    const res = await request(app).get("/api/products").query({ limit: 500 });

    // A caller asking for "as many as you'll give me" gets capped, not rejected.
    expect(res.status).toBe(200);
    expect(res.body.pagination.limit).toBe(100);
    expect(res.body.products.length).toBeLessThanOrEqual(100);
  });
});
