import { describe, it, expect, beforeEach, afterEach, afterAll } from "vitest";
import request from "supertest";
import app from "../app";
import { prisma } from "../lib/prisma";
import { resetLoginRateLimiter } from "../middleware/rateLimiter";
import { uniqueEmail, TEST_PASSWORD } from "./helpers";

// The login rate limiter keeps its counters in an in-memory store that lives for
// the whole test process, so one test's failed logins would otherwise throttle
// the next (and the dedicated rate-limit tests below would poison every login
// test that ran after them). Reset before each test for a clean slate.
beforeEach(() => {
  resetLoginRateLimiter();
});

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

describe("POST /api/auth/login — rate limiting", () => {
  it("returns 429 once the attempt limit is exceeded, not another 401", async () => {
    const email = uniqueEmail("bruteforce");
    await register(email);

    // 5 allowed, the 6th is throttled. Sequential so the failing index is exact.
    const responses: import("supertest").Response[] = [];
    for (let i = 0; i < 6; i++) {
      responses.push(
        await request(app).post("/api/auth/login").send({ email, password: "wrong-password" })
      );
    }

    expect(responses.map((r) => r.status)).toEqual([401, 401, 401, 401, 401, 429]);

    const limited = responses[5];
    // The 429 body uses the app's one error shape: { error: <string> }, no
    // Zod-style details, and nothing new invented for this status.
    expect(typeof limited.body.error).toBe("string");
    expect(limited.body.error.length).toBeGreaterThan(0);
    expect(limited.body.details).toBeUndefined();

    // standardHeaders on, legacyHeaders off.
    expect(limited.headers["ratelimit-limit"]).toBe("5");
    expect(limited.headers["x-ratelimit-limit"]).toBeUndefined();
  });

  it("still logs a user in normally while under the limit", async () => {
    const email = uniqueEmail("under-limit");
    await register(email);

    // Four failures — one short of the cap — then the real password still works.
    for (let i = 0; i < 4; i++) {
      const bad = await request(app)
        .post("/api/auth/login")
        .send({ email, password: "wrong-password" });
      expect(bad.status).toBe(401);
    }

    const ok = await request(app)
      .post("/api/auth/login")
      .send({ email, password: TEST_PASSWORD });

    expect(ok.status).toBe(200);
    expect(typeof ok.body.token).toBe("string");
  });

  it("throttles per account: exhausting one email does not lock out another", async () => {
    const victim = uniqueEmail("victim");
    const bystander = uniqueEmail("bystander");
    await register(victim);
    await register(bystander);

    for (let i = 0; i < 6; i++) {
      await request(app).post("/api/auth/login").send({ email: victim, password: "wrong-password" });
    }
    const victimBlocked = await request(app)
      .post("/api/auth/login")
      .send({ email: victim, password: TEST_PASSWORD });
    expect(victimBlocked.status).toBe(429);

    // Same client, different account — its own counter is untouched.
    const bystanderOk = await request(app)
      .post("/api/auth/login")
      .send({ email: bystander, password: TEST_PASSWORD });
    expect(bystanderOk.status).toBe(200);
  });
});

describe("GET /api/users/me", () => {
  it("returns 401 without a token", async () => {
    const res = await request(app).get("/api/users/me");

    expect(res.status).toBe(401);
  });
});
