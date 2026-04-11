"use client";

import BmsMetricsGraph from "./BmsMetricsGraph";
import type { BmsEvent, BmsEventType } from "../lib/bms-types";

const TYPE_META: Record<
  BmsEventType,
  { label: string; color: string; dot: string }
> = {
  lifecycle: { label: "LIFECYCLE", color: "text-cyan-400", dot: "bg-cyan-400" },
  metric: { label: "METRIC", color: "text-blue-400", dot: "bg-blue-400" },
  error: { label: "ERROR", color: "text-red-400", dot: "bg-red-400" },
  info: { label: "INFO", color: "text-zinc-300", dot: "bg-zinc-400" },
  warning: { label: "WARNING", color: "text-yellow-400", dot: "bg-yellow-400" },
};

function formatRelative(ts: number): string {
  const diffMs = Date.now() - ts;
  const diffSec = Math.floor(diffMs / 1000);
  if (diffSec < 60) return `${diffSec}s ago`;
  const diffMin = Math.floor(diffSec / 60);
  if (diffMin < 60) return `${diffMin}m ago`;
  const diffHr = Math.floor(diffMin / 60);
  return `${diffHr}h ago`;
}

interface BmsPostProps {
  event: BmsEvent;
}

export default function BmsPost({ event }: BmsPostProps) {
  const meta = TYPE_META[event.type] ?? TYPE_META.info;

  // Build "Tags" from raw RootPlanner state variables
  const ignoredKeys = new Set(["timestamp"]);
  const tags = Object.entries(event.state)
    .filter(([k]) => !ignoredKeys.has(k))
    .map(([k, v]) => `#${k}_${v}`);

  return (
    <article className="border border-zinc-800 rounded-xl overflow-hidden bg-zinc-950">
      {/* Post header — avatar + name + timestamp */}
      <div className="flex items-center gap-3 px-4 py-3">
        <div className="relative flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-full border border-zinc-700 bg-zinc-900">
          <span className="text-[10px] font-bold text-zinc-400">BMS</span>
          <span className={`absolute -right-0.5 -top-0.5 h-2.5 w-2.5 rounded-full ring-2 ring-zinc-950 ${meta.dot}`} />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold text-white leading-none">RootPlanner</p>
          <p className="text-xs text-zinc-500 leading-none mt-0.5">
            <span className={`font-mono font-medium ${meta.color}`}>{meta.label}</span>
            <span className="mx-1">·</span>
            <span>{formatRelative(event.timestamp)}</span>
          </p>
        </div>
        <span className="font-mono text-[10px] text-zinc-700 shrink-0">#{event.id.slice(0, 8)}</span>
      </div>

      {/* Media slot: live SVG metrics graph or Unity WebGL placeholder */}
      {event.mediaType === "unity" ? (
        <div className="w-full bg-black flex items-center justify-center" style={{ aspectRatio: "16/9" }}>
          {/* Unity WebGL viewport — replace this with your <canvas> or iframe */}
          <div className="flex flex-col items-center gap-2 text-zinc-600">
            <svg className="h-12 w-12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1">
              <rect x="2" y="3" width="20" height="14" rx="2" />
              <path d="M8 21h8M12 17v4" />
            </svg>
            <span className="text-xs font-mono">UNITY WEBGL VIEWPORT</span>
            <span className="text-[10px]">Attach &lt;canvas id=&quot;unity-canvas&quot;&gt; here</span>
          </div>
        </div>
      ) : (
        <BmsMetricsGraph cpuHistory={event.cpuHistory} batteryHistory={event.batteryHistory} />
      )}

      {/* Caption: BMS log message */}
      <div className="px-4 pt-3 pb-1">
        <p className="text-sm text-zinc-200 leading-snug font-mono">{event.message}</p>
      </div>

      {/* Tags: raw RootPlanner variables */}
      {tags.length > 0 && (
        <div className="px-4 pb-3 pt-1 flex flex-wrap gap-1.5">
          {tags.map((tag) => (
            <span key={tag} className="text-[11px] font-mono text-cyan-600 hover:text-cyan-400 cursor-default transition-colors">
              {tag}
            </span>
          ))}
        </div>
      )}

      {/* Technical state footer */}
      <div className="border-t border-zinc-800 px-4 py-2 flex gap-4 font-mono text-[11px] text-zinc-600">
        <span>CPU <span className="text-cyan-500">{event.state.cpu}%</span></span>
        <span>BATT <span className="text-green-500">{event.state.battery}%</span></span>
        <span>CONN <span className={
          event.state.connection === "online" ? "text-green-400" :
          event.state.connection === "degraded" ? "text-yellow-400" : "text-red-400"
        }>{event.state.connection}</span></span>
        <span className="ml-auto text-zinc-700">{new Date(event.timestamp).toISOString()}</span>
      </div>
    </article>
  );
}
