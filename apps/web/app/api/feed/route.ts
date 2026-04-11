import { NextResponse } from "next/server";
import { getLatestRecords, ingestRecord, totalProcessed, plannerActive } from "@/lib/feed-store";
import type { VisualStateRecord, FeedResponse } from "@/lib/feed-types";

export const dynamic = "force-dynamic";

export async function GET() {
  const records = getLatestRecords(20);
  const body: FeedResponse = { records, totalProcessed, plannerActive };
  return NextResponse.json(body);
}

export async function POST(request: Request) {
  try {
    const record = (await request.json()) as VisualStateRecord;
    if (!record.id || !record.timestamp || !record.visualState || !record.technicalMetrics) {
      return NextResponse.json({ error: "Invalid record shape" }, { status: 400 });
    }
    ingestRecord(record);
    return NextResponse.json({ ok: true, id: record.id }, { status: 201 });
  } catch {
    return NextResponse.json({ error: "Failed to parse body" }, { status: 400 });
  }
}
