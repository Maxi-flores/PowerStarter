/**
 * Helpers for safely casting Prisma's opaque `Json` / `JsonValue` columns
 * back to their typed application shapes.
 *
 * Prisma stores JSON columns as `JsonValue` which is a union of all possible
 * JSON-compatible types.  Because the data was validated by Zod on the way
 * in, we can safely cast through `unknown`; but we centralise that cast here
 * so it's easy to swap in proper runtime validation later.
 *
 * @example
 *   import { fromJson } from "@powerstarter/database";
 *   const bms = fromJson<BmsMetrics>(row.bms);
 */

import type { JsonValue } from "@prisma/client/runtime/client.js";

/**
 * Cast a Prisma `JsonValue` field to a typed application shape `T`.
 *
 * Returns `null` when the value is `null` or `undefined`.
 * Data integrity is guaranteed by the Zod validation performed on write.
 */
export function fromJson<T>(value: JsonValue | null | undefined): T | null {
  if (value == null) return null;
  return value as unknown as T;
}
