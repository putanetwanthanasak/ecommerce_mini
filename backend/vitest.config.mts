import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    // File parallelism is left at Vitest's default. Every file talks to the same
    // Postgres, but each seeds its own fixtures under random identifiers and only
    // ever asserts on rows it created, so parallel workers don't interfere.
    // If that ever stops holding — or the database runs out of connections, since
    // each worker opens its own Prisma pool — run with --no-file-parallelism
    // before restructuring the tests.
    //
    // The concurrent-order test deliberately makes one request wait on a row lock,
    // and the order transaction itself is configured with a 15s timeout. The 5s
    // default would fail the test before the code under test had a chance to.
    testTimeout: 30000,
    hookTimeout: 30000,
    include: ["src/__tests__/**/*.test.ts"],
    // DATABASE_URL / JWT_SECRET come from a local .env in dev and from real
    // environment variables in CI. dotenv does not overwrite what is already set,
    // so CI's values always win and no URL is ever hardcoded here.
    setupFiles: ["dotenv/config"],
  },
});
