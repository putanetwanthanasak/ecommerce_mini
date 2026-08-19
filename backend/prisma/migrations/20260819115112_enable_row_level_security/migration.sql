-- Enable Row Level Security on every table, and deliberately add NO policies.
--
-- WHY: the database is Supabase-hosted, and Supabase exposes every table in the
-- `public` schema through PostgREST (its REST endpoint) and the client SDKs,
-- reachable with the project's publishable/anon key. With RLS disabled those
-- endpoints serve the table to anyone holding that key -- which is exactly what
-- the Supabase advisor flagged. Enabling RLS closes that door: PostgREST
-- connects as the `anon` or `authenticated` role, and a table with RLS on and
-- zero policies denies those roles every row.
--
-- This covers `_prisma_migrations` too. It is Prisma's own bookkeeping rather
-- than application data, but it lives in `public` like everything else, so
-- PostgREST exposes it just the same -- leaking migration names, timestamps and
-- checksums. Leaving it as the one table without RLS keeps the advisor warning
-- alive and reads as an oversight rather than a decision. Prisma continues to
-- read and write it normally, for the BYPASSRLS reason below.
--
-- WHY NO POLICIES: this application never touches PostgREST or the Supabase
-- client SDK. All access goes through the Express API, which connects over
-- DATABASE_URL as the `postgres` role. That role owns these tables and is
-- BYPASSRLS, so Prisma is completely unaffected -- policies would only be
-- consulted for a client that does not exist here. Denying `anon` and
-- `authenticated` outright is the correct posture, not a gap.
--
-- DO NOT "fix" this by adding permissive policies. A policy such as
-- `USING (true)` re-opens the direct-from-browser access this migration exists
-- to shut, and re-triggers the advisor warning it resolves. Authorization for
-- this app lives in Express (requireAuth / requireAdmin plus the per-row
-- ownership checks in the order routes), where it is tested. If a future
-- feature genuinely needs the Supabase SDK, that is the point to design real
-- policies against `auth.uid()` -- as its own deliberate change, with tests.
--
-- Note: FORCE ROW LEVEL SECURITY is intentionally not set. It would apply RLS
-- to the table owner as well, and with no policies present that would lock the
-- API out of its own database.

ALTER TABLE "users" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "categories" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "products" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "orders" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "order_items" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "_prisma_migrations" ENABLE ROW LEVEL SECURITY;
