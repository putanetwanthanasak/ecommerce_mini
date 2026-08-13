import { describe, it, expect, afterEach, afterAll } from "vitest";
import request from "supertest";
import app from "../app";
import { prisma } from "../lib/prisma";
import { uniqueEmail, TEST_PASSWORD } from "./helpers";

// Registration creates rows through the API, so ids are collected as they come
// back and removed after each test rather than seeded up front.
const createdUserIds: string[] = [];

async function register(email: string, password = TEST_PASSWORD) {
  const res = await request(app)
    .post("/api/auth/register")
    .send({ email, password, name: "Test User" });

  if (res.body?.user?.id) createdUserIds.push(res.body.user.id);
  return res;
}

afterEach(async () => {
  if (createdUserIds.length === 0) return;
  await prisma.user.deleteMany({ where: { id: { in: createdUserIds } } });
  createdUserIds.length = 0;
});

afterAll(async () => {
  await prisma.$disconnect();
});

describe("POST /api/auth/register", () => {
  it("creates a user and returns a token without leaking the password hash", async () => {
    const email = uniqueEmail("register");
    const res = await register(email);

    expect(res.status).toBe(201);
    expect(res.body.user).toMatchObject({ email, role: "CUSTOMER" });
    expect(typeof res.body.token).toBe("string");

    // Checked over the whole serialized body, not just user.passwordHash — a
    // future `include` somewhere could reintroduce it at a different path.
    expect(JSON.stringify(res.body)).not.toContain("passwordHash");
    expect(JSON.stringify(res.body)).not.toContain(TEST_PASSWORD);
  });

  it("rejects an email that is already registered with 409", async () => {
    const email = uniqueEmail("duplicate");

    const first = await register(email);
    expect(first.status).toBe(201);

    const second = await register(email);
    expect(second.status).toBe(409);
  });
});

describe("POST /api/auth/login", () => {
  it("returns 200 and a token for the correct password", async () => {
    const email = uniqueEmail("login");
    await register(email);

    const res = await request(app)
      .post("/api/auth/login")
      .send({ email, password: TEST_PASSWORD });

    expect(res.status).toBe(200);
    expect(typeof res.body.token).toBe("string");
    expect(res.body.user.email).toBe(email);
    expect(JSON.stringify(res.body)).not.toContain("passwordHash");
  });

  it("returns 401 for a wrong password", async () => {
    const email = uniqueEmail("wrongpass");
    await register(email);

    const res = await request(app)
      .post("/api/auth/login")
      .send({ email, password: "definitely-not-the-password" });

    expect(res.status).toBe(401);
  });

  it("returns the identical 401 for an unregistered email as for a wrong password", async () => {
    const email = uniqueEmail("enumeration");
    await register(email);

    const wrongPassword = await request(app)
      .post("/api/auth/login")
      .send({ email, password: "definitely-not-the-password" });

    const unknownEmail = await request(app)
      .post("/api/auth/login")
      .send({ email: uniqueEmail("never-registered"), password: TEST_PASSWORD });

    // Deliberate: distinct responses would let an attacker enumerate which
    // addresses have accounts. Status and body must be indistinguishable.
    expect(unknownEmail.status).toBe(401);
    expect(wrongPassword.status).toBe(401);
    expect(unknownEmail.body).toEqual(wrongPassword.body);
  });
});

describe("GET /api/users/me", () => {
  it("returns 401 without a token", async () => {
    const res = await request(app).get("/api/users/me");

    expect(res.status).toBe(401);
  });
});
