import { NextRequest } from "next/server";
import { subscribeBms, getBmsEvents } from "../../../../lib/bms-store";

/**
 * GET /api/bms/stream
 *
 * Server-Sent Events stream.  On connect the client receives all existing
 * events (as individual "event: init" messages) and then receives every new
 * BMS event in real time.
 */
export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function GET(req: NextRequest) {
  const encoder = new TextEncoder();

  const stream = new ReadableStream({
    start(controller) {
      // Send all existing events immediately so the feed is populated on load
      const existing = getBmsEvents();
      for (const event of [...existing].reverse()) {
        const data = `event: init\ndata: ${JSON.stringify(event)}\n\n`;
        controller.enqueue(encoder.encode(data));
      }

      // Subscribe to future events
      const unsub = subscribeBms((event) => {
        const data = `event: bms\ndata: ${JSON.stringify(event)}\n\n`;
        try {
          controller.enqueue(encoder.encode(data));
        } catch {
          // Client disconnected; cleanup handled below
        }
      });

      // Heartbeat every 15 s to keep the connection alive through proxies
      const heartbeat = setInterval(() => {
        try {
          controller.enqueue(encoder.encode(": heartbeat\n\n"));
        } catch {
          clearInterval(heartbeat);
        }
      }, 15_000);

      // Clean up when the client disconnects
      req.signal.addEventListener("abort", () => {
        unsub();
        clearInterval(heartbeat);
        try {
          controller.close();
        } catch {
          // Already closed
        }
      });
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache, no-transform",
      Connection: "keep-alive",
      "X-Accel-Buffering": "no",
    },
  });
}
