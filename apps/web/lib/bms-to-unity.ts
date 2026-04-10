/**
 * bmsToUnity – maps Powerframe BmsMetrics to UnityDisplayData.
 *
 * This is the authoritative transformation between the BMS calculation
 * engine and the Unity game interface display layer.
 *
 * Mapping rules
 * ─────────────
 * health   = stateOfHealth (0–100), rounded to nearest integer.
 *
 * score    = a weighted 0–100 score combining SoC and SoH:
 *              Math.round(stateOfCharge × (stateOfHealth / 100))
 *            A fully-charged, healthy pack scores 100; a depleted or
 *            degraded pack scores progressively lower.
 *
 * level    = discretised battery status tier used by Unity for environment
 *            and hazard logic:
 *              0 – CRITICAL  SoC ≤ 10 %
 *              1 – LOW       SoC 11–25 %
 *              2 – NORMAL    SoC 26–75 %
 *              3 – HIGH      SoC > 75 %
 *            A pack that is actively charging (packCurrent > 0) is promoted
 *            one tier (capped at 3) to reflect available energy flow.
 *
 * position = defaults to the world origin {0, 0, 0}; Unity will place the
 *            object at the appropriate rack/slot via its own scene logic.
 *
 * metadata = a flat snapshot of the most decision-relevant BMS fields for
 *            Unity HUD rendering (avoids re-fetching the full BMS payload).
 */

import type { BmsMetrics, UnityDisplayData } from "@ui/src/types/instance-result";

/**
 * Maps a {@link BmsMetrics} record to a {@link UnityDisplayData} object.
 *
 * @param instanceName - The human-readable name of the instance (used as the
 *   HUD display label together with pack voltage).
 * @param bms - The validated BMS metrics produced by Powerframe.
 * @returns A {@link UnityDisplayData} object ready to be persisted and
 *   consumed by the Unity game interface.
 */
export function bmsToUnity(
  instanceName: string,
  bms: BmsMetrics
): UnityDisplayData {
  const health = Math.round(bms.stateOfHealth);
  const score = Math.round(bms.stateOfCharge * (bms.stateOfHealth / 100));

  let level: number;
  if (bms.stateOfCharge <= 10) {
    level = 0; // CRITICAL
  } else if (bms.stateOfCharge <= 25) {
    level = 1; // LOW
  } else if (bms.stateOfCharge <= 75) {
    level = 2; // NORMAL
  } else {
    level = 3; // HIGH
  }

  // Actively charging → promote one tier (max 3)
  if (bms.packCurrent > 0) {
    level = Math.min(level + 1, 3);
  }

  return {
    displayName: `${instanceName} – ${bms.packVoltage.toFixed(1)} V`,
    score,
    level,
    position: { x: 0, y: 0, z: 0 },
    health,
    metadata: {
      stateOfCharge: bms.stateOfCharge,
      stateOfHealth: bms.stateOfHealth,
      packVoltage: bms.packVoltage,
      packCurrent: bms.packCurrent,
      capacityAh: bms.capacityAh,
      cellCount: bms.cellCount,
      balancingActive: bms.balancingActive,
      estimatedRuntimeMin: bms.estimatedRuntimeMin,
    },
  };
}
