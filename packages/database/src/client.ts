/**
 * Singleton Prisma Client for the Powerstarter database package.
 *
 * Prisma 7 requires a driver adapter for direct database connections.
 * We use @prisma/adapter-pg backed by the `pg` connection pool.
 *
 * The DATABASE_URL environment variable must be set to a valid PostgreSQL
 * connection string (e.g. "postgresql://user:pass@host:5432/dbname").
 *
 * In development (Next.js hot-reload) we attach the instance to `global`
 * so it survives module re-evaluation without exhausting the connection pool.
 *
 * Usage:
 *   import { prisma } from "@powerstarter/database";
 */

import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

const globalRef = global as typeof global & { __prisma?: PrismaClient };

if (!globalRef.__prisma) {
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) {
    throw new Error(
      "[database] DATABASE_URL is not set. " +
        "Provide a valid PostgreSQL connection string to use the Prisma client."
    );
  }

  const adapter = new PrismaPg({ connectionString });
  globalRef.__prisma = new PrismaClient({
    adapter,
    log:
      process.env.NODE_ENV === "development"
        ? ["query", "warn", "error"]
        : ["warn", "error"],
  });
}

export const prisma: PrismaClient = globalRef.__prisma;
