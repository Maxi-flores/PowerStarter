/**
 * Zod validation schemas that mirror every field of the shared
 * InstanceResult family of interfaces from @powerstarter/ui.
 *
 * Import these schemas in API route handlers to validate untrusted input
 * before writing to the database.
 */

import { z } from "zod";

// ---------------------------------------------------------------------------
// Primitives & sub-schemas
// ---------------------------------------------------------------------------

export const InstanceStatusSchema = z.enum([
  "active",
  "inactive",
  "pending",
  "error",
]);

export const CellGroupMetricsSchema = z.object({
  groupId: z.string().min(1),
  minVoltage: z.number(),
  maxVoltage: z.number(),
  avgVoltage: z.number(),
  temperature: z.number(),
});

export const BmsMetricsSchema = z.object({
  packVoltage: z.number(),
  packCurrent: z.number(),
  capacityAh: z.number().positive(),
  stateOfCharge: z.number().min(0).max(100),
  stateOfHealth: z.number().min(0).max(100),
  cellCount: z.number().int().positive(),
  cellGroups: z.array(CellGroupMetricsSchema),
  balancingActive: z.boolean(),
  estimatedRuntimeMin: z.number().min(0),
});

export const Vector3Schema = z.object({
  x: z.number(),
  y: z.number(),
  z: z.number(),
});

export const UnityDisplayDataSchema = z.object({
  displayName: z.string().min(1),
  score: z.number().int().min(0),
  level: z.number().int().min(0),
  position: Vector3Schema,
  health: z.number().min(0).max(100),
  metadata: z.record(z.union([z.string(), z.number(), z.boolean()])),
});

// ---------------------------------------------------------------------------
// Full InstanceResult (used for deserialising stored records)
// ---------------------------------------------------------------------------

export const InstanceResultSchema = z.object({
  id: z.string().uuid(),
  name: z.string().min(1).max(100),
  status: InstanceStatusSchema,
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
  bms: BmsMetricsSchema.nullable(),
  unity: UnityDisplayDataSchema.nullable(),
  tags: z.array(z.string()).optional(),
});

// ---------------------------------------------------------------------------
// POST /api/instances – incoming body shape from the Powerframe BMS
// ---------------------------------------------------------------------------

/**
 * Shape of the JSON body the BMS sends to POST /api/instances.
 * Only `name` and `bms` are required; the rest are derived or defaulted.
 */
export const CreateInstanceBodySchema = z.object({
  /** Human-readable name for the instance (e.g. "Pack A – Rack 3"). */
  name: z.string().min(1).max(100),
  /** Raw metrics produced by the Powerframe BMS calculation engine. */
  bms: BmsMetricsSchema,
  /** Optional initial lifecycle status; defaults to "active". */
  status: InstanceStatusSchema.optional().default("active"),
  /** Optional free-form tags for the portfolio UI. */
  tags: z.array(z.string()).optional(),
});

export type CreateInstanceBody = z.infer<typeof CreateInstanceBodySchema>;

// ---------------------------------------------------------------------------
// PATCH /api/instances/[id] – partial update body
// ---------------------------------------------------------------------------

/**
 * URL-safe slug validator: lowercase alphanumeric + hyphens, 3-80 chars.
 */
const SlugSchema = z
  .string()
  .min(3)
  .max(80)
  .regex(
    /^[a-z0-9]+(?:-[a-z0-9]+)*$/,
    "Slug must be lowercase alphanumeric words separated by hyphens."
  );

/**
 * Shape of the JSON body for PATCH /api/instances/[id].
 * At least one field must be provided.
 */
export const PatchInstanceBodySchema = z
  .object({
    /** Publish or unpublish the instance to the Community feed. */
    isPublic: z.boolean().optional(),
    /**
     * URL-safe slug for the shareable portfolio link.
     * Auto-generated from the instance name when `isPublic` is set to true
     * and no explicit slug is supplied.
     */
    slug: SlugSchema.optional(),
  })
  .refine((data) => data.isPublic !== undefined || data.slug !== undefined, {
    message: "At least one of isPublic or slug must be provided.",
  });

export type PatchInstanceBody = z.infer<typeof PatchInstanceBodySchema>;
