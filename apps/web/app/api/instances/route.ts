/**
 * /api/instances – Core API handler for Powerstarter instance records.
 *
 * POST  (authenticated – Bearer token required via middleware)
 *   Accepts a validated BmsMetrics payload from the Powerframe BMS,
 *   derives the Unity display data via `bmsToUnity`, builds an
 *   InstanceResult, persists it to the store, and returns 201.
 *
 * GET   (public – read-only for the Unity game interface)
 *   Returns all stored instances as a flat JSON array, newest first.
 *   No authentication required; no write access is possible.
 */

import { NextRequest, NextResponse } from "next/server";
import { ZodError } from "zod";

import { CreateInstanceBodySchema } from "@/lib/schemas";
import { bmsToUnity } from "@/lib/bms-to-unity";
import { upsertInstance, listInstances } from "@/lib/instance-store";
import type { InstanceResult } from "@ui/src/types/instance-result";

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
  //    and the wrapper fields exactly before we touch the store).
  let body: ReturnType<typeof CreateInstanceBodySchema.parse>;
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

  // 4. Build the full InstanceResult
  const now = new Date().toISOString();
  const record: InstanceResult = {
    id: crypto.randomUUID(),
    name: body.name,
    status: body.status,
    createdAt: now,
    updatedAt: now,
    bms: body.bms,
    unity,
    tags: body.tags,
  };

  // 5. Persist
  upsertInstance(record);

  return NextResponse.json(record, { status: 201 });
}

// ---------------------------------------------------------------------------
// GET /api/instances
// ---------------------------------------------------------------------------

export async function GET(): Promise<NextResponse> {
  const instances = listInstances();

  return NextResponse.json(instances, {
    status: 200,
    headers: {
      // Allow the Unity WebGL build to call this endpoint cross-origin
      "Access-Control-Allow-Origin": "*",
      "Cache-Control": "no-store",
    },
  });
}
