/**
 * /api/community – Public Community feed.
 *
 * GET (public – no authentication required)
 *   Returns the top-performing public instances ordered by Unity score
 *   descending, then Unity level descending as a tiebreaker.
 *   Only instances where `isPublic = true` are returned.
 *
 *   Query params:
 *     limit  – maximum number of results (default 20, max 100)
 */

import { NextRequest, NextResponse } from "next/server";
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

// ---------------------------------------------------------------------------
// GET /api/community
// ---------------------------------------------------------------------------

export async function GET(request: NextRequest): Promise<NextResponse> {
  const { searchParams } = request.nextUrl;
  const rawLimit = parseInt(searchParams.get("limit") ?? "20", 10);
  const limit = Math.min(Math.max(isNaN(rawLimit) ? 20 : rawLimit, 1), 100);

  // Fetch all public instances; sort by Unity score/level in JS because
  // Unity data is stored in an opaque JSON column which Prisma can't sort.
  const rows = await prisma.instance.findMany({
    where: { isPublic: true },
    // Bring the most recently updated records into the sort window first
    // before the in-memory secondary sort, to handle ties cleanly.
    orderBy: { updatedAt: "desc" },
  });

  const instances: InstanceResult[] = rows
    .map(rowToInstanceResult)
    .sort((a, b) => {
      const scoreA = a.unity?.score ?? 0;
      const scoreB = b.unity?.score ?? 0;
      if (scoreB !== scoreA) return scoreB - scoreA;
      const levelA = a.unity?.level ?? 0;
      const levelB = b.unity?.level ?? 0;
      return levelB - levelA;
    })
    .slice(0, limit);

  return NextResponse.json(instances, {
    status: 200,
    headers: {
      "Access-Control-Allow-Origin": "*",
      "Cache-Control": "public, max-age=30, stale-while-revalidate=60",
    },
  });
}
