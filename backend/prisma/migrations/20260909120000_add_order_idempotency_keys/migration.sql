-- Idempotency ledger for POST /api/orders. The client sends an `Idempotency-Key`
-- header (a UUID) once per checkout attempt; the first request for a given
-- (userId, key) claims a row inside the order transaction and records its
-- response, and any retry replays that response instead of placing a second
-- order. See invariant 9 in CLAUDE.md and src/routes/orders.ts for the race this
-- closes and why the claim happens before any product row is touched.

-- CreateTable
CREATE TABLE "idempotency_keys" (
    "id" TEXT NOT NULL,
    "key" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "responseStatus" INTEGER,
    "responseBody" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "idempotency_keys_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "idempotency_keys_key_idx" ON "idempotency_keys"("key");

-- CreateIndex
CREATE UNIQUE INDEX "idempotency_keys_userId_key_key" ON "idempotency_keys"("userId", "key");

-- AddForeignKey
ALTER TABLE "idempotency_keys" ADD CONSTRAINT "idempotency_keys_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- Keep the RLS posture uniform with 20260819115112_enable_row_level_security:
-- every table in `public` has Row Level Security enabled and NO policies, so
-- Supabase's PostgREST / anon-key path is denied every row while Prisma (which
-- connects as the BYPASSRLS `postgres` role) is unaffected. A new table left
-- without this re-triggers the Supabase security advisor. Do NOT add a
-- permissive policy here — see that migration's comment for the full reasoning.
ALTER TABLE "idempotency_keys" ENABLE ROW LEVEL SECURITY;
