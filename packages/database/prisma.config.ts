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

export default defineConfig({
  datasource: {
    url: process.env.DATABASE_URL!,
  },
});
