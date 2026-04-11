"use client";

import { useEffect, useRef, useState } from "react";
import BmsPost from "./BmsPost";
import type { BmsEvent } from "../lib/bms-types";

/**
 * BmsFeed subscribes to /api/bms/stream (SSE) and renders an
 * Instagram-style list of posts, newest at the top.
 * On initial load it receives all stored events via "init" SSE messages.
 */
export default function BmsFeed() {
  const [events, setEvents] = useState<BmsEvent[]>([]);
  const [connected, setConnected] = useState(false);
  const [newCount, setNewCount] = useState(0);
  const esRef = useRef<EventSource | null>(null);

  useEffect(() => {
    const es = new EventSource("/api/bms/stream");
    esRef.current = es;

    es.addEventListener("init", (e: MessageEvent) => {
      const event: BmsEvent = JSON.parse(e.data);
      setEvents((prev) => {
        // Avoid duplicates on reconnect
        if (prev.some((p) => p.id === event.id)) return prev;
        return [...prev, event].sort((a, b) => b.timestamp - a.timestamp);
      });
    });

    es.addEventListener("bms", (e: MessageEvent) => {
      const event: BmsEvent = JSON.parse(e.data);
      setEvents((prev) => {
        if (prev.some((p) => p.id === event.id)) return prev;
        return [event, ...prev];
      });
      setNewCount((n) => n + 1);
    });

    es.onopen = () => setConnected(true);
    es.onerror = () => setConnected(false);

    return () => {
      es.close();
    };
  }, []);

  return (
    <div className="mx-auto max-w-xl px-4 pb-16">
      {/* Connection status bar */}
      <div className="sticky top-[61px] z-40 flex items-center justify-between py-2">
        <div className="flex items-center gap-2 text-xs font-mono text-zinc-500">
          <span className={`inline-block h-2 w-2 rounded-full ${connected ? "bg-green-400 animate-pulse" : "bg-red-500"}`} />
          {connected ? "STREAM LIVE" : "RECONNECTING…"}
        </div>
        {newCount > 0 && (
          <button
            className="text-xs font-mono text-cyan-400 hover:text-cyan-300 transition-colors"
            onClick={() => {
              setNewCount(0);
              window.scrollTo({ top: 0, behavior: "smooth" });
            }}
          >
            ↑ {newCount} new event{newCount !== 1 ? "s" : ""}
          </button>
        )}
      </div>

      {/* Feed */}
      {events.length === 0 ? (
        <div className="flex flex-col items-center gap-4 py-20 text-center text-zinc-600">
          <div className="h-16 w-16 rounded-full border-2 border-zinc-800 flex items-center justify-center">
            <span className="text-2xl">📡</span>
          </div>
          <p className="text-sm font-mono">Waiting for BMS events…</p>
          <p className="text-xs max-w-xs leading-relaxed">
            Push events via{" "}
            <code className="bg-zinc-900 px-1 py-0.5 rounded text-cyan-500">
              POST /api/bms/push
            </code>{" "}
            or run one of the BMS push scripts.
          </p>
        </div>
      ) : (
        <div className="flex flex-col gap-6 pt-2">
          {events.map((event) => (
            <BmsPost key={event.id} event={event} />
          ))}
        </div>
      )}
    </div>
  );
}
