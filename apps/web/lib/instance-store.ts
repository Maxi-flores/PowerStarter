/**
 * In-memory Powerstarter instance store.
 *
 * This module exposes a singleton Map<id, InstanceResult> that persists
 * for the lifetime of the Node.js server process.
 *
 * NOTE: This is intentionally a simple in-memory store suitable for
 * development and portfolio demonstration purposes.  When a persistent
 * database is added (e.g. Postgres via Prisma, or a KV store), replace
 * the functions below with the appropriate DB client calls without
 * changing the public API of this module.
 */

import type { InstanceResult } from "@ui/src/types/instance-result";

/** Module-level singleton – survives hot-reloads in dev via global reference. */
const globalRef = global as typeof global & {
  __instanceStore?: Map<string, InstanceResult>;
};

if (!globalRef.__instanceStore) {
  globalRef.__instanceStore = new Map<string, InstanceResult>();
}

const store: Map<string, InstanceResult> = globalRef.__instanceStore;

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

/** Persist a new or updated instance record. */
export function upsertInstance(record: InstanceResult): void {
  store.set(record.id, record);
}

/** Retrieve a single instance by its UUID, or `undefined` if not found. */
export function getInstance(id: string): InstanceResult | undefined {
  return store.get(id);
}

/**
 * Return all stored instances as a flat, time-ordered array
 * (newest `updatedAt` first).
 */
export function listInstances(): InstanceResult[] {
  return Array.from(store.values()).sort(
    (a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
  );
}

/** Remove a single instance record. Returns true if the record existed. */
export function deleteInstance(id: string): boolean {
  return store.delete(id);
}
