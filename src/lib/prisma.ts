import { PrismaClient } from "@prisma/client";

// Singleton pattern so we don't exhaust DB connections in dev (hot-reload)
declare global {
  // eslint-disable-next-line no-var
  var prisma: PrismaClient | undefined;
}

export const prisma = global.prisma || new PrismaClient();

if (process.env.NODE_ENV !== "production") {
  global.prisma = prisma;
}
