import { NextRequest, NextResponse } from "next/server";
import { pushBmsEvent } from "../../../../lib/bms-store";
import type { BmsPushPayload } from "../../../../lib/bms-types";

/**
 * POST /api/bms/push
 *
 * Accepts a BMS lifecycle event from the RootPlanner host (or the bms-push
 * scripts) and stores it so the SSE stream delivers it to connected clients.
 *
 * Body shape: BmsPushPayload (JSON)
 */
export async function POST(req: NextRequest) {
  let body: BmsPushPayload;

  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  if (!body.type || !body.message || !body.state) {
    return NextResponse.json(
      { error: "Missing required fields: type, message, state" },
      { status: 422 }
    );
  }

  const event = pushBmsEvent(body);
  return NextResponse.json({ ok: true, id: event.id }, { status: 201 });
}
