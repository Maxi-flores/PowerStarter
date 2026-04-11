/**
 * In-memory store that simulates @trt/db until the real package is wired up.
 * Seeded with representative sample data covering every VisualTheme variant.
 */
import type { VisualStateRecord, VisualTheme } from "./feed-types";

function makeRecord(
  id: string,
  offsetMs: number,
  theme: VisualTheme,
  label: string,
  state: string,
  voltage: number,
  soc: number,
  current: number
): VisualStateRecord {
  return {
    id,
    timestamp: new Date(Date.now() - offsetMs).toISOString(),
    visualState: { theme, label },
    technicalMetrics: { state, voltage, soc, current, cellCount: 16 },
  };
}

const SEED: VisualStateRecord[] = [
  makeRecord("rec-001", 0,       "normal",   "Pack healthy",          "Discharging",  52.4, 87, -12.5),
  makeRecord("rec-002", 30_000,  "charging", "Charging in progress",  "Charging",     53.1, 72, 18.0),
  makeRecord("rec-003", 90_000,  "warning",  "High temperature",      "Discharging",  51.8, 65, -9.0),
  makeRecord("rec-004", 180_000, "fault",    "Cell voltage imbalance","Fault",        49.2, 30, 0.0),
  makeRecord("rec-005", 300_000, "idle",     "System standby",        "Idle",         52.0, 80, 0.0),
  makeRecord("rec-006", 420_000, "normal",   "Pack healthy",          "Discharging",  52.3, 85, -11.0),
  makeRecord("rec-007", 600_000, "charging", "Bulk charge",           "Charging",     54.4, 55, 22.0),
  makeRecord("rec-008", 900_000, "warning",  "Low SOC alert",         "Discharging",  48.5, 15, -7.5),
  makeRecord("rec-009", 1_200_000,"fault",   "Over-current detected", "Fault",        47.1, 10, 0.0),
  makeRecord("rec-010", 1_800_000,"normal",  "Recovery complete",     "Discharging",  52.6, 78, -10.0),
];

// Mutable store — newest first
export const feedStore: VisualStateRecord[] = [...SEED];

// Stats (private, accessed through getters)
let _totalProcessed = SEED.length;
let _plannerActive = true;

/** Return the latest `limit` records (newest-first) */
export function getLatestRecords(limit = 20): VisualStateRecord[] {
  return feedStore.slice(0, limit);
}

/** Total number of records ever ingested */
export function getTotalProcessed(): number {
  return _totalProcessed;
}

/** Whether the RootPlanner is active */
export function isPlannerActive(): boolean {
  return _plannerActive;
}

/** Ingest a new record (prepend so newest is first) */
export function ingestRecord(record: VisualStateRecord): void {
  feedStore.unshift(record);
  _totalProcessed += 1;
}
