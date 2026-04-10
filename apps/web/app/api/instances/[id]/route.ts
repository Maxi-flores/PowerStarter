/**
 * /api/instances/[id] – Per-instance mutation handler.
 *
 * PATCH (authenticated – Bearer token required via middleware)
 *   Updates the `isPublic` flag and/or `slug` of an existing instance.
 *   When `isPublic` is set to `true` and no `slug` is supplied, a
 *   URL-safe slug is auto-generated from the instance name.
 */

import { NextRequest, NextResponse } from "next/server";
import { ZodError } from "zod";

import { PatchInstanceBodySchema, type PatchInstanceBody } from "@/lib/schemas";
import { prisma, fromJson } from "@powerstarter/database";
import type { Instance } from "@prisma/client";
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
    isPublic: row.isPublic,
    slug: row.slug,
  };
}

/**
 * Derive a URL-safe slug from an arbitrary string.
 * Lower-cases, replaces whitespace/special chars with hyphens,
 * collapses consecutive hyphens, and trims edge hyphens.
 */
function slugify(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80);
}

// ---------------------------------------------------------------------------
// PATCH /api/instances/[id]
// ---------------------------------------------------------------------------

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
): Promise<NextResponse> {
  const { id } = params;

  // 1. Parse body
  let rawBody: unknown;
  try {
    rawBody = await request.json();
  } catch {
    return jsonError("Request body must be valid JSON.", 400);
  }

  // 2. Validate
  let body: PatchInstanceBody;
  try {
    body = PatchInstanceBodySchema.parse(rawBody);
  } catch (err) {
    if (err instanceof ZodError) {
      return jsonError("Validation failed.", 422, err.flatten());
    }
    throw err;
  }

  // 3. Resolve slug – auto-generate if publishing and no slug provided
  let resolvedSlug = body.slug;
  if (body.isPublic === true && !resolvedSlug) {
    // Fetch the name so we can derive a slug from it
    const existing = await prisma.instance.findUnique({
      where: { id },
      select: { name: true, slug: true },
    });
    if (!existing) {
      return jsonError("Instance not found.", 404);
    }
    // Reuse existing slug if already set, otherwise generate a new one
    resolvedSlug = existing.slug ?? slugify(existing.name);
  }

  // 4. Build the update payload
  const updateData: {
    isPublic?: boolean;
    slug?: string;
    updatedAt: Date;
  } = { updatedAt: new Date() };

  if (body.isPublic !== undefined) updateData.isPublic = body.isPublic;
  if (resolvedSlug !== undefined) updateData.slug = resolvedSlug;

  // 5. Persist
  let row: Instance;
  try {
    row = await prisma.instance.update({
      where: { id },
      data: updateData,
    });
  } catch (err: unknown) {
    // Prisma throws P2025 when the record is not found
    if (
      typeof err === "object" &&
      err !== null &&
      "code" in err &&
      (err as { code: string }).code === "P2025"
    ) {
      return jsonError("Instance not found.", 404);
    }
    // P2002 = unique constraint violation (slug already taken)
    if (
      typeof err === "object" &&
      err !== null &&
      "code" in err &&
      (err as { code: string }).code === "P2002"
    ) {
      return jsonError(
        "Slug is already taken. Please choose a different slug.",
        409
      );
    }
    throw err;
  }

  return NextResponse.json(rowToInstanceResult(row), { status: 200 });
}
