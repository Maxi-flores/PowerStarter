/**
 * unity-sync – Formats Powerstarter data for Unity's UnityWebRequest.
 *
 * Unity's C# `UnityWebRequest.Post` and `UnityWebRequest.Get` helpers parse
 * the response body as a flat JSON object.  Unity's built-in
 * `JsonUtility.FromJson<T>` only deserialises the **top-level** fields of the
 * JSON string; it does not recurse into nested objects.
 *
 * This module provides:
 *
 *   `toUnityPayload(instance)`
 *     Converts a full `InstanceResult` into a flat `UnityPayload` object
 *     where every field Unity needs – `score`, `level`, `health`, and the
 *     BMS snapshot values – is a top-level primitive.
 *
 *   `toUnityBatchPayload(instances)`
 *     Wraps an array of `InstanceResult`s into the `{ instances: [...] }`
 *     envelope that the Unity community-feed parser expects.
 *
 *   `serializeForUnity(payload)`
 *     Produces the JSON string ready to pass to `UnityWebRequest`.
 *
 * Usage (in a Next.js route handler or server action):
 * ─────────────────────────────────────────────────────
 *   import { toUnityPayload, serializeForUnity } from "@/lib/unity-sync";
 *
 *   const json = serializeForUnity(toUnityPayload(instance));
 *   // pass `json` to the Unity client or return it from an API route
 *
 * C# counterpart (Unity side):
 * ─────────────────────────────
 *   [System.Serializable]
 *   public class UnityPayload {
 *     public string id;
 *     public string name;
 *     public string status;
 *     public int    score;
 *     public int    level;
 *     public int    health;
 *     public string displayName;
 *     public float  stateOfCharge;
 *     public float  stateOfHealth;
 *     public float  packVoltage;
 *     public float  packCurrent;
 *     public float  capacityAh;
 *     public int    cellCount;
 *     public bool   balancingActive;
 *     public float  estimatedRuntimeMin;
 *     public bool   isPublic;
 *     public string slug;
 *     public string updatedAt;
 *   }
 *
 *   var req = UnityWebRequest.Get("/api/instances");
 *   yield return req.SendWebRequest();
 *   var payload = JsonUtility.FromJson<UnityPayload>(req.downloadHandler.text);
 */

import type { InstanceResult } from "@ui/src/types/instance-result";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

/**
 * Flat JSON shape consumed directly by Unity's `JsonUtility.FromJson<T>`.
 *
 * All fields are top-level primitives – no nested objects – so that Unity's
 * reflection-based deserialiser can map them without a custom converter.
 */
export interface UnityPayload {
  /** UUID of the Powerstarter instance. */
  id: string;
  /** Human-readable instance name. */
  name: string;
  /** Lifecycle status string. */
  status: string;

  // ── Unity display ──────────────────────────────────────────────────────────
  /** Current in-game score (0–100). */
  score: number;
  /** Discretised battery tier (0 = CRITICAL … 3 = HIGH). */
  level: number;
  /** Health points derived from State-of-Health (0–100). */
  health: number;
  /** HUD display label used in the Unity scene. */
  displayName: string;

  // ── BMS snapshot ───────────────────────────────────────────────────────────
  /** State of Charge (%). */
  stateOfCharge: number;
  /** State of Health (%). */
  stateOfHealth: number;
  /** Pack terminal voltage (V). */
  packVoltage: number;
  /** Pack current – positive = charging, negative = discharging (A). */
  packCurrent: number;
  /** Nominal pack capacity (Ah). */
  capacityAh: number;
  /** Total number of cells in the pack. */
  cellCount: number;
  /** Whether cell balancing is active. */
  balancingActive: boolean;
  /** Estimated remaining runtime (minutes). */
  estimatedRuntimeMin: number;

  // ── Community ──────────────────────────────────────────────────────────────
  /** Whether this instance is published to the Community feed. */
  isPublic: boolean;
  /**
   * URL-safe slug for the shareable portfolio link.
   * Empty string when the instance has not been published.
   */
  slug: string;

  /** ISO-8601 timestamp of the most recent update. */
  updatedAt: string;
}

/** Envelope for the community-feed batch endpoint. */
export interface UnityBatchPayload {
  /** Total number of instances in this response. */
  count: number;
  /** Flat instance payloads ready for Unity deserialisation. */
  instances: UnityPayload[];
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** Sentinel values used when BMS or Unity data is absent. */
const BMS_DEFAULTS = {
  stateOfCharge: 0,
  stateOfHealth: 0,
  packVoltage: 0,
  packCurrent: 0,
  capacityAh: 0,
  cellCount: 0,
  balancingActive: false,
  estimatedRuntimeMin: 0,
} as const;

const UNITY_DEFAULTS = {
  score: 0,
  level: 0,
  health: 0,
  displayName: "",
} as const;

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

/**
 * Converts a single `InstanceResult` into a flat `UnityPayload`.
 *
 * Fields are guaranteed to be present and correctly typed even when the BMS
 * or Unity data blobs are `null` (sentinel zero/false/empty values are used so
 * Unity's struct deserialiser never encounters a missing field).
 */
export function toUnityPayload(instance: InstanceResult): UnityPayload {
  const bms = instance.bms ?? BMS_DEFAULTS;
  const unity = instance.unity ?? UNITY_DEFAULTS;

  return {
    id: instance.id,
    name: instance.name,
    status: instance.status,

    // Top-level Unity display fields – the primary reason this helper exists
    score: unity.score,
    level: unity.level,
    health: unity.health,
    displayName: unity.displayName,

    // Flat BMS snapshot
    stateOfCharge: bms.stateOfCharge,
    stateOfHealth: bms.stateOfHealth,
    packVoltage: bms.packVoltage,
    packCurrent: bms.packCurrent,
    capacityAh: bms.capacityAh,
    cellCount: bms.cellCount,
    balancingActive: bms.balancingActive,
    estimatedRuntimeMin: bms.estimatedRuntimeMin,

    // Community
    isPublic: instance.isPublic ?? false,
    slug: instance.slug ?? "",

    updatedAt: instance.updatedAt,
  };
}

/**
 * Converts an array of `InstanceResult`s into a `UnityBatchPayload` envelope.
 *
 * Use this when sending the full community leaderboard to Unity so the C#
 * parser can iterate `payload.instances` without knowing the total count in
 * advance.
 */
export function toUnityBatchPayload(
  instances: InstanceResult[]
): UnityBatchPayload {
  return {
    count: instances.length,
    instances: instances.map(toUnityPayload),
  };
}

/**
 * Serialises a `UnityPayload` or `UnityBatchPayload` to the JSON string
 * expected by `UnityWebRequest.downloadHandler.text`.
 *
 * Pass the return value directly to the Unity client or as the body of a
 * `text/plain` (or `application/json`) HTTP response.
 */
export function serializeForUnity(
  payload: UnityPayload | UnityBatchPayload
): string {
  return JSON.stringify(payload);
}
