/**
 * /api/community/stream – Server-Sent Events (SSE) live community feed.
 *
 * GET (public – no authentication required)
 *   Opens a persistent SSE connection and pushes the top-performing public
 *   instances to the client every POLL_INTERVAL_MS milliseconds.  Each push
 *   is emitted as an SSE `data:` event containing a JSON array of instances
 *   sorted by Unity score descending, then level descending as a tiebreaker.
 *
 *   The client closes the connection by aborting the request (e.g. the
 *   browser tab is closed, or the component is unmounted).
 *
 * Event format
 * ────────────
 *   event: community-update
 *   data: <JSON array of InstanceResult>
 *
 * Client usage (browser / Next.js Client Component)
 * ──────────────────────────────────────────────────
 *   const sse = new EventSource("/api/community/stream");
 *   sse.addEventListener("community-update", (e) => {
 *     const instances = JSON.parse(e.data);
 *     // update UI
 *   });
 *   // Clean up when done:
 *   sse.close();
 *
 * Deployment note
 * ────────────────
 *   SSE requires the platform to support long-lived HTTP connections
 *   (streaming responses).  Vercel Edge Functions and serverless runtimes
 *   impose response-time limits that may close the connection prematurely.
 *   For production use on such platforms, consider a lower POLL_INTERVAL_MS
 *   and rely on the browser's built-in SSE reconnect logic (`retry:` directive).
 *
 * Query params
 * ────────────
 *   limit    – max instances per event (default 20, max 100)
 *   interval – poll interval in seconds (default 5, min 2, max 60)
 */

import { NextRequest } from "next/server";
import { prisma, fromJson } from "@powerstarter/database";
import type { Instance } from "@prisma/client";
import type {
  InstanceResult,
  BmsMetrics,
  UnityDisplayData,
} from "@ui/src/types/instance-result";

// ---------------------------------------------------------------------------
// Config
// ---------------------------------------------------------------------------

const DEFAULT_POLL_INTERVAL_S = 5;
const MIN_POLL_INTERVAL_S = 2;
const MAX_POLL_INTERVAL_S = 60;
const DEFAULT_LIMIT = 20;
const MAX_LIMIT = 100;

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

async function fetchTopPublicInstances(limit: number): Promise<InstanceResult[]> {
  const rows = await prisma.instance.findMany({
    where: { isPublic: true },
    orderBy: { updatedAt: "desc" },
  });

  return rows
    .map(rowToInstanceResult)
    .sort((a, b) => {
      const scoreA = a.unity?.score ?? 0;
      const scoreB = b.unity?.score ?? 0;
      if (scoreB !== scoreA) return scoreB - scoreA;
      return (b.unity?.level ?? 0) - (a.unity?.level ?? 0);
    })
    .slice(0, limit);
}

/** Formats a single SSE message with a named event type. */
function sseMessage(event: string, data: unknown): string {
  return `event: ${event}\ndata: ${JSON.stringify(data)}\n\n`;
}

// ---------------------------------------------------------------------------
// GET /api/community/stream
// ---------------------------------------------------------------------------

export async function GET(request: NextRequest): Promise<Response> {
  const { searchParams } = request.nextUrl;

  const rawLimit = parseInt(searchParams.get("limit") ?? String(DEFAULT_LIMIT), 10);
  const limit = Math.min(Math.max(isNaN(rawLimit) ? DEFAULT_LIMIT : rawLimit, 1), MAX_LIMIT);

  const rawInterval = parseInt(
    searchParams.get("interval") ?? String(DEFAULT_POLL_INTERVAL_S),
    10
  );
  const intervalS = Math.min(
    Math.max(isNaN(rawInterval) ? DEFAULT_POLL_INTERVAL_S : rawInterval, MIN_POLL_INTERVAL_S),
    MAX_POLL_INTERVAL_S
  );
  const intervalMs = intervalS * 1000;

  const stream = new ReadableStream({
    async start(controller) {
      const signal = request.signal;

      const push = (chunk: string) => {
        controller.enqueue(new TextEncoder().encode(chunk));
      };

      // Tell the browser how long to wait before reconnecting if the
      // connection drops (in milliseconds).
      push(`retry: ${intervalMs}\n\n`);

      // Send the initial snapshot immediately so the client doesn't
      // have to wait for the first poll interval.
      try {
        const initial = await fetchTopPublicInstances(limit);
        push(sseMessage("community-update", initial));
      } catch (err) {
        console.error("[community/stream] initial fetch failed:", err);
      }

      // Poll on a fixed interval until the client disconnects.
      const timer = setInterval(async () => {
        if (signal.aborted) {
          clearInterval(timer);
          controller.close();
          return;
        }

        try {
          const instances = await fetchTopPublicInstances(limit);
          push(sseMessage("community-update", instances));
        } catch (err) {
          // Log the error but keep the connection open; the client will
          // receive the next successful poll.
          console.error("[community/stream] poll error:", err);
        }
      }, intervalMs);

      // Clean up the timer when the client closes the connection.
      signal.addEventListener("abort", () => {
        clearInterval(timer);
        controller.close();
      });
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream; charset=utf-8",
      "Cache-Control": "no-cache, no-transform",
      Connection: "keep-alive",
      // Allow the Unity WebGL build and community pages to connect cross-origin
      "Access-Control-Allow-Origin": "*",
    },
  });
}
