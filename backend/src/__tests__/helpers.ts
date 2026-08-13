import { randomUUID } from "crypto";
import bcrypt from "bcryptjs";
import { prisma } from "../lib/prisma";
import { signToken } from "../utils/jwt";

// Every fixture carries a random suffix. Test files run against one shared
// database, so a fixed name like "Electronics" would collide with a leftover row
// or with another file's fixture and make the suite order-dependent.
export function unique(prefix: string): string {
  return `${prefix}-${randomUUID()}`;
}

export function uniqueEmail(prefix = "user"): string {
  // .test is a reserved TLD (RFC 2606) — these addresses can never be real.
  return `${prefix}-${randomUUID()}@example.test`;
}

export const TEST_PASSWORD = "password123";

export interface TestUser {
  id: string;
  email: string;
  password: string;
  token: string;
}

// Created through Prisma rather than POST /api/auth/register because register
// always assigns CUSTOMER — an admin fixture can't be made through the API.
// The token is signed with the same helper the routes use, so it is a real one.
export async function createUser(role: "CUSTOMER" | "ADMIN" = "CUSTOMER"): Promise<TestUser> {
  const email = uniqueEmail(role.toLowerCase());
  const user = await prisma.user.create({
    data: {
      email,
      name: `Test ${role}`,
      passwordHash: await bcrypt.hash(TEST_PASSWORD, 10),
      role,
    },
  });

  return {
    id: user.id,
    email,
    password: TEST_PASSWORD,
    token: signToken({ userId: user.id, role }),
  };
}

export async function createCategory(namePrefix = "category"): Promise<string> {
  const category = await prisma.category.create({ data: { name: unique(namePrefix) } });
  return category.id;
}

export async function createProduct(opts: {
  categoryId: string;
  price: number | string;
  stock: number;
  name?: string;
}): Promise<string> {
  const product = await prisma.product.create({
    data: {
      name: opts.name ?? unique("product"),
      price: opts.price.toString(),
      stock: opts.stock,
      categoryId: opts.categoryId,
    },
  });
  return product.id;
}

export async function getStock(productId: string): Promise<number> {
  const product = await prisma.product.findUniqueOrThrow({ where: { id: productId } });
  return product.stock;
}

/**
 * Deletes fixture rows in foreign-key-safe order. Each test cleans up what it
 * created so the suite can run repeatedly and in any order.
 * An empty id array matches nothing, so passing only some of the keys is fine.
 */
export async function destroyFixtures(ids: {
  userIds?: string[];
  productIds?: string[];
  categoryIds?: string[];
}): Promise<void> {
  const { userIds = [], productIds = [], categoryIds = [] } = ids;

  await prisma.orderItem.deleteMany({
    where: {
      OR: [{ productId: { in: productIds } }, { order: { userId: { in: userIds } } }],
    },
  });
  await prisma.order.deleteMany({ where: { userId: { in: userIds } } });
  await prisma.product.deleteMany({
    where: { OR: [{ id: { in: productIds } }, { categoryId: { in: categoryIds } }] },
  });
  await prisma.category.deleteMany({ where: { id: { in: categoryIds } } });
  await prisma.user.deleteMany({ where: { id: { in: userIds } } });
}
