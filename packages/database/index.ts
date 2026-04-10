/**
 * Public barrel export for @powerstarter/database.
 *
 * Re-exports the singleton Prisma client and the generated Prisma types
 * so consumers only need a single import:
 *
 *   import { prisma } from "@powerstarter/database";
 */

export { prisma } from "./src/client";

// Re-export generated Prisma types so consumers don't need to import from
// "@prisma/client" directly.
export type { Instance, InstanceStatus, Prisma } from "@prisma/client";
