/**
 * InstanceResult – single source of truth shared between:
 *   • Powerframe BMS calculation engine
 *   • Unity game interface display layer
 *
 * Both consumers must import from this file.
 * Do NOT duplicate or extend locally – widen this interface instead.
 */

// ---------------------------------------------------------------------------
// Status
// ---------------------------------------------------------------------------

/** Lifecycle state of a Powerstarter instance. */
export type InstanceStatus = "active" | "inactive" | "pending" | "error";

// ---------------------------------------------------------------------------
// BMS (Battery Management System) – Powerframe calculations
// ---------------------------------------------------------------------------

/** Real-time electrical measurements for a single cell group. */
export interface CellGroupMetrics {
  /** Unique identifier for the cell group (e.g. "A1", "B2"). */
  groupId: string;
  /** Minimum cell voltage in the group (V). */
  minVoltage: number;
  /** Maximum cell voltage in the group (V). */
  maxVoltage: number;
  /** Average cell voltage in the group (V). */
  avgVoltage: number;
  /** Cell temperature (°C). */
  temperature: number;
}

/** Powerframe BMS calculation results for one instance. */
export interface BmsMetrics {
  /** Pack terminal voltage (V). */
  packVoltage: number;
  /** Pack current – positive = charging, negative = discharging (A). */
  packCurrent: number;
  /** Nominal pack capacity (Ah). */
  capacityAh: number;
  /** State of Charge – 0–100 %. */
  stateOfCharge: number;
  /** State of Health – 0–100 %. */
  stateOfHealth: number;
  /** Total number of cells in the pack. */
  cellCount: number;
  /** Per-cell-group metrics. */
  cellGroups: CellGroupMetrics[];
  /** Balancing active flag. */
  balancingActive: boolean;
  /** Estimated remaining range/runtime (minutes). */
  estimatedRuntimeMin: number;
}

// ---------------------------------------------------------------------------
// Unity game interface display
// ---------------------------------------------------------------------------

/** 3-D position for use in the Unity scene. */
export interface Vector3 {
  x: number;
  y: number;
  z: number;
}

/** Display data consumed by the Unity game interface. */
export interface UnityDisplayData {
  /** Human-readable label shown in the Unity HUD. */
  displayName: string;
  /** Current in-game score. */
  score: number;
  /** Current game level. */
  level: number;
  /** Instance avatar / object world position. */
  position: Vector3;
  /** Health points – 0–100. */
  health: number;
  /** Arbitrary key-value metadata the Unity layer may render. */
  metadata: Record<string, string | number | boolean>;
}

// ---------------------------------------------------------------------------
// InstanceResult – combined record written to the Powerstarter database
// ---------------------------------------------------------------------------

/**
 * The authoritative shape of a Powerstarter instance record.
 *
 * This interface is the **single source of truth** for:
 *   - Powerframe BMS calculation output
 *   - Unity game interface consumption
 *   - Powerstarter database persistence
 */
export interface InstanceResult {
  /** Globally-unique instance identifier (UUID v4 recommended). */
  id: string;
  /** Human-readable name for the instance. */
  name: string;
  /** Current lifecycle status. */
  status: InstanceStatus;
  /** ISO-8601 timestamp of when this record was created. */
  createdAt: string;
  /** ISO-8601 timestamp of the most recent update. */
  updatedAt: string;
  /**
   * BMS metrics produced by the Powerframe calculation engine.
   * Present whenever the BMS module has reported data.
   */
  bms: BmsMetrics | null;
  /**
   * Display data consumed by the Unity game interface.
   * Present whenever the Unity layer is active.
   */
  unity: UnityDisplayData | null;
  /** Optional free-form tags for filtering/grouping in the portfolio UI. */
  tags?: string[];
  /** Whether this instance is published to the Community feed. */
  isPublic?: boolean;
  /** URL-safe slug for the shareable portfolio link. Set when published. */
  slug?: string | null;
}
