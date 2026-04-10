/**
 * Prisma 7 configuration file.
 *
 * Prisma 7 requires database connection details to be specified here rather
 * than inside schema.prisma.  The DATABASE_URL environment variable must be
 * set at runtime (and during migrations).
 *
 * See https://pris.ly/d/config-datasource
 */

import { defineConfig } from "prisma/config";

// DATABASE_URL is validated at runtime in src/client.ts when the Prisma
// client is first instantiated.  During `prisma generate` (which evaluates
// this file but does not connect to the database) we fall back to a
// placeholder URL to satisfy the parser without opening a real connection.
export default defineConfig({
  datasource: {
    url: process.env.DATABASE_URL ?? "postgresql://placeholder@localhost:5432/placeholder",
  },
});
