import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    // Every test file talks to the same Postgres. Files run in separate workers,
    // each with its own Prisma client and connection pool; running them serially
    // keeps the connection count low and stops one file's fixtures from racing
    // another's. The suite is small — the wall-clock cost is a few seconds.
    fileParallelism: false,
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
