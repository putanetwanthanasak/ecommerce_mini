import { describe, it, expect } from "vitest";
import jwt from "jsonwebtoken";
import { randomUUID } from "crypto";
import { signToken, verifyToken, JwtPayload } from "../utils/jwt";

// Unit tests — no database, no HTTP. These cover the piece requireAuth trusts.
describe("jwt utils", () => {
  const payload: JwtPayload = { userId: randomUUID(), role: "ADMIN" };

  it("round-trips a payload through sign and verify", () => {
    const decoded = verifyToken(signToken(payload));

    expect(decoded.userId).toBe(payload.userId);
    expect(decoded.role).toBe(payload.role);
  });

  it("rejects a token whose signature has been tampered with", () => {
    const [header, body, signature] = signToken(payload).split(".");

    // Flip one character of the signature segment. The header and body stay
    // valid base64 and decode fine — only the HMAC no longer matches, which is
    // exactly what an attacker editing the claims would produce.
    const flipped = (signature[0] === "a" ? "b" : "a") + signature.slice(1);
    const tampered = `${header}.${body}.${flipped}`;

    expect(tampered).not.toBe(signToken(payload));
    expect(() => verifyToken(tampered)).toThrow(jwt.JsonWebTokenError);
  });

  it("rejects an expired token", () => {
    // signToken hardcodes a 1-day expiry, so the expiry is overridden here by
    // signing with the same secret directly. A negative expiresIn backdates the
    // `exp` claim, giving an already-expired but otherwise perfectly valid token
    // without making the suite sleep.
    const expired = jwt.sign(payload, process.env.JWT_SECRET as string, { expiresIn: -60 });

    expect(() => verifyToken(expired)).toThrow(jwt.TokenExpiredError);
  });
});
