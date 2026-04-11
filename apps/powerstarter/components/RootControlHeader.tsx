"use client";

import { useEffect, useState } from "react";
import type { RootPlannerState } from "../lib/bms-types";

/** Fetches /api/bms/stats on mount and refreshes every 5 s. */
export default function RootControlHeader() {
  const [stats, setStats] = useState<RootPlannerState | null>(null);

  useEffect(() => {
    async function fetchStats() {
      try {
        const res = await fetch("/api/bms/stats");
        if (res.status === 204) return;
        if (res.ok) setStats(await res.json());
      } catch {
        // ignore network errors
      }
    }

    fetchStats();
    const id = setInterval(fetchStats, 5_000);
    return () => clearInterval(id);
  }, []);

  const cpu = stats?.cpu ?? null;
  const battery = stats?.battery ?? null;
  const connection = stats?.connection ?? "offline";

  const connectionColor =
    connection === "online"
      ? "text-green-400"
      : connection === "degraded"
        ? "text-yellow-400"
        : "text-red-400";

  const batteryColor =
    battery === null ? "text-zinc-400" : battery > 40 ? "text-green-400" : battery > 20 ? "text-yellow-400" : "text-red-400";

  return (
    <header className="sticky top-0 z-50 border-b border-zinc-800 bg-zinc-950/95 backdrop-blur">
      <div className="mx-auto flex max-w-xl items-center justify-between px-4 py-3">
        {/* Branding / "profile" name */}
        <div className="flex items-center gap-3">
          <div className="relative flex h-10 w-10 items-center justify-center rounded-full border-2 border-cyan-500 bg-zinc-900">
            <span className="text-xs font-bold text-cyan-400">BMS</span>
            {/* Online pulse indicator */}
            {connection === "online" && (
              <span className="absolute -right-0.5 -top-0.5 h-3 w-3 rounded-full bg-green-400 ring-2 ring-zinc-950" />
            )}
          </div>
          <div>
            <p className="text-sm font-semibold text-white leading-none">RootPlanner</p>
            <p className={`text-xs leading-none mt-0.5 ${connectionColor}`}>
              {connection}
            </p>
          </div>
        </div>

        {/* Live system stats */}
        <div className="flex items-center gap-4 text-xs font-mono">
          {/* CPU gauge */}
          <div className="flex flex-col items-center gap-0.5">
            <span className="text-zinc-500 uppercase tracking-widest text-[10px]">CPU</span>
            <div className="flex items-center gap-1">
              <div className="h-1.5 w-16 rounded-full bg-zinc-800 overflow-hidden">
                <div
                  className="h-full rounded-full bg-cyan-500 transition-all duration-700"
                  style={{ width: `${cpu ?? 0}%` }}
                />
              </div>
              <span className="text-cyan-300 w-7 text-right">{cpu !== null ? `${cpu}%` : "--"}</span>
            </div>
          </div>

          {/* Battery gauge */}
          <div className="flex flex-col items-center gap-0.5">
            <span className="text-zinc-500 uppercase tracking-widest text-[10px]">BATT</span>
            <div className="flex items-center gap-1">
              <div className="h-1.5 w-16 rounded-full bg-zinc-800 overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all duration-700 ${batteryColor.replace("text-", "bg-")}`}
                  style={{ width: `${battery ?? 100}%` }}
                />
              </div>
              <span className={`w-7 text-right ${batteryColor}`}>
                {battery !== null ? `${battery}%` : "--"}
              </span>
            </div>
          </div>

          {/* Connection badge */}
          <div className="flex flex-col items-center gap-0.5">
            <span className="text-zinc-500 uppercase tracking-widest text-[10px]">CONN</span>
            <span className={`font-semibold uppercase text-[11px] ${connectionColor}`}>{connection}</span>
          </div>
        </div>
      </div>
    </header>
  );
}
