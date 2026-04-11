import { NextResponse } from "next/server";
import { getLatestState } from "../../../../lib/bms-store";

/**
 * GET /api/bms/stats
 *
 * Returns the latest RootPlanner system stats (CPU, battery, connection) for
 * the Root Control Header.  Returns 204 with no body when no data has been
 * pushed yet.
 */
export const dynamic = "force-dynamic";

export function GET() {
  const state = getLatestState();
  if (!state) {
    return new NextResponse(null, { status: 204 });
  }
  return NextResponse.json(state);
}
