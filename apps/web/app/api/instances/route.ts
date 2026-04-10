/**
 * /api/instances – Core API handler for Powerstarter instance records.
 *
 * POST  (authenticated – Bearer token required via middleware)
 *   Accepts a validated BmsMetrics payload from the Powerframe BMS,
 *   derives the Unity display data via `bmsToUnity`, builds an
 *   InstanceResult, persists it to the database via Prisma, and returns 201.
 *
 * GET   (public – read-only for the Unity game interface)
 *   Returns all stored instances as a flat JSON array, newest first.
 *   No authentication required; no write access is possible.
 */

import { NextRequest, NextResponse } from "next/server";
import { ZodError } from "zod";
import type { Instance, Prisma } from "@prisma/client";

import { CreateInstanceBodySchema, type CreateInstanceBody } from "@/lib/schemas";
import { bmsToUnity } from "@/lib/bms-to-unity";
import { prisma, fromJson } from "@powerstarter/database";
import type {
  InstanceResult,
  BmsMetrics,
  UnityDisplayData,
} from "@ui/src/types/instance-result";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function jsonError(
  message: string,
  status: number,
  details?: unknown
): NextResponse {
  return NextResponse.json({ error: message, details }, { status });
}

/**
 * Maps a Prisma `Instance` row back to the shared `InstanceResult` shape.
 *
 * Prisma stores `bms` and `unity` as opaque `Json` columns; we use the
 * centralised `fromJson` helper from @powerstarter/database to cast them.
 * Data integrity is guaranteed by the Zod validation performed on write.
 */
function rowToInstanceResult(row: Instance): InstanceResult {
  return {
    id: row.id,
    name: row.name,
    status: row.status,
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
    bms: fromJson<BmsMetrics>(row.bms),
    unity: fromJson<UnityDisplayData>(row.unity),
    tags: row.tags,
  };
}

// ---------------------------------------------------------------------------
// POST /api/instances
// ---------------------------------------------------------------------------

export async function POST(request: NextRequest): Promise<NextResponse> {
  // 1. Parse the raw JSON body
  let rawBody: unknown;
  try {
    rawBody = await request.json();
  } catch {
    return jsonError("Request body must be valid JSON.", 400);
  }

  // 2. Validate against the Zod schema (ensures the payload matches BmsMetrics
  //    and the wrapper fields exactly before we touch the database).
  let body: CreateInstanceBody;
  try {
    body = CreateInstanceBodySchema.parse(rawBody);
  } catch (err) {
    if (err instanceof ZodError) {
      return jsonError("Validation failed.", 422, err.flatten());
    }
    throw err;
  }

  // 3. Derive UnityDisplayData from the validated BMS metrics
  const unity = bmsToUnity(body.name, body.bms);

  // 4. Persist via Prisma create.
  //    Each POST from the BMS creates a new timestamped record.
  //    BmsMetrics and UnityDisplayData are plain JSON-serialisable objects;
  //    casting to Prisma.InputJsonValue satisfies the Json column constraint.
  const now = new Date();
  const bmsJson = body.bms as unknown as Prisma.InputJsonValue;
  const unityJson = unity as unknown as Prisma.InputJsonValue;

  const row = await prisma.instance.create({
    data: {
      id: crypto.randomUUID(),
      name: body.name,
      status: body.status,
      createdAt: now,
      updatedAt: now,
      bms: bmsJson,
      unity: unityJson,
      tags: body.tags ?? [],
    },
  });

  const record = rowToInstanceResult(row);
  return NextResponse.json(record, { status: 201 });
}

// ---------------------------------------------------------------------------
// GET /api/instances
// ---------------------------------------------------------------------------

export async function GET(): Promise<NextResponse> {
  const rows = await prisma.instance.findMany({
    orderBy: { updatedAt: "desc" },
  });

  const instances: InstanceResult[] = rows.map(rowToInstanceResult);

  return NextResponse.json(instances, {
    status: 200,
    headers: {
      // Allow the Unity WebGL build to call this endpoint cross-origin
      "Access-Control-Allow-Origin": "*",
      "Cache-Control": "no-store",
    },
  });
}
