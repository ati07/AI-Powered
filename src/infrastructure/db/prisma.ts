import { PrismaClient } from "@prisma/client";

/**
 * Singleton PrismaClient — prevents exhausting connections during hot-reloads.
 *
 * In development, Next.js hot-reloads can create many `PrismaClient` instances.
 * Storing it on `globalThis` avoids this.
 */
const globalForPrisma = globalThis as unknown as { prisma: PrismaClient | undefined };

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    log:
      process.env.NODE_ENV === "development"
        ? ["query", "error", "warn"]
        : ["error"],
  });

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}
