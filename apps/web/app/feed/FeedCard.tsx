"use client";

import type { VisualStateRecord, VisualTheme } from "@/lib/feed-types";
import { formatDistanceToNow } from "date-fns";

// ─── Theme mappings ──────────────────────────────────────────────────────────

interface ThemeStyle {
  backgroundClass: string;
  animationClass: string;
  accentClass: string;
  bgClass: string; // explicit bg-* utility for SOC bar
  icon: string;
}

const THEME_STYLES: Record<VisualTheme, ThemeStyle> = {
  fault: {
    backgroundClass: "bg-red-950",
    animationClass: "animate-pulse",
    accentClass: "text-red-400 border-red-700",
    bgClass: "bg-red-400",
    icon: "⚠",
  },
  warning: {
    backgroundClass: "bg-amber-950",
    animationClass: "animate-pulse",
    accentClass: "text-amber-400 border-amber-700",
    bgClass: "bg-amber-400",
    icon: "⚡",
  },
  charging: {
    backgroundClass: "bg-blue-950",
    animationClass: "animate-[chargeGlow_2s_ease-in-out_infinite]",
    accentClass: "text-blue-400 border-blue-700",
    bgClass: "bg-blue-400",
    icon: "🔋",
  },
  normal: {
    backgroundClass: "bg-green-950",
    animationClass: "",
    accentClass: "text-green-400 border-green-700",
    bgClass: "bg-green-400",
    icon: "✓",
  },
  idle: {
    backgroundClass: "bg-gray-900",
    animationClass: "",
    accentClass: "text-gray-400 border-gray-700",
    bgClass: "bg-gray-400",
    icon: "◉",
  },
};

// ─── Caption generator ───────────────────────────────────────────────────────

function buildCaption(record: VisualStateRecord): string {
  const { visualState, technicalMetrics } = record;
  return `${visualState.label} — ${technicalMetrics.voltage.toFixed(1)} V`;
}

// ─── Component ───────────────────────────────────────────────────────────────

interface FeedCardProps {
  record: VisualStateRecord;
}

export default function FeedCard({ record }: FeedCardProps) {
  const { visualState, technicalMetrics, timestamp } = record;
  const style = THEME_STYLES[visualState.theme] ?? THEME_STYLES.idle;
  const caption = buildCaption(record);
  const textColorClass = style.accentClass.split(" ")[0]; // e.g. "text-red-400"

  const timeAgo = formatDistanceToNow(new Date(timestamp), { addSuffix: true });

  return (
    <article className="w-full max-w-lg mx-auto bg-gray-800 rounded-2xl overflow-hidden shadow-lg border border-gray-700">
      {/* ── Header ─────────────────────────────────────────────────────── */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-gray-700">
        <div className="flex items-center gap-2">
          <span className={`w-8 h-8 flex items-center justify-center rounded-full text-sm font-bold border ${style.accentClass}`}>
            {style.icon}
          </span>
          <span className={`text-sm font-semibold uppercase tracking-wide ${textColorClass}`}>
            {technicalMetrics.state}
          </span>
        </div>
        <time className="text-xs text-gray-500" dateTime={timestamp}>
          {timeAgo}
        </time>
      </div>

      {/* ── Visual / "Image" area ───────────────────────────────────────── */}
      <div className={`relative flex flex-col items-center justify-center h-48 ${style.backgroundClass} ${style.animationClass}`}>
        {/* Voltage readout */}
        <span className={`text-5xl font-extrabold tabular-nums ${textColorClass}`}>
          {technicalMetrics.voltage.toFixed(1)}
          <span className="text-2xl ml-1 font-normal opacity-70">V</span>
        </span>

        {/* SOC bar */}
        {technicalMetrics.soc !== undefined && (
          <div className="mt-4 w-2/3">
            <div className="flex justify-between text-xs text-gray-400 mb-1">
              <span>SOC</span>
              <span>{technicalMetrics.soc}%</span>
            </div>
            <div className="h-2 w-full rounded-full bg-gray-700">
              <div
                className={`h-2 rounded-full transition-all ${style.bgClass}`}
                style={{ width: `${technicalMetrics.soc}%` }}
              />
            </div>
          </div>
        )}

        {/* Theme label badge */}
        <span className={`absolute top-3 right-3 px-2 py-0.5 rounded-full text-xs font-medium border ${style.accentClass}`}>
          {visualState.theme.toUpperCase()}
        </span>
      </div>

      {/* ── Caption ────────────────────────────────────────────────────── */}
      <div className="px-4 py-3">
        <p className="text-sm text-gray-200 leading-relaxed">
          <span className="font-semibold text-white">BMS&nbsp;</span>
          {caption}
        </p>

        {/* Extra metrics row */}
        <div className="mt-2 flex gap-4 text-xs text-gray-500">
          {technicalMetrics.current !== undefined && (
            <span>
              Current:{" "}
              <span className="text-gray-300">
                {technicalMetrics.current >= 0 ? "+" : ""}
                {technicalMetrics.current.toFixed(1)} A
              </span>
            </span>
          )}
          {technicalMetrics.cellCount !== undefined && (
            <span>
              Cells: <span className="text-gray-300">{technicalMetrics.cellCount}</span>
            </span>
          )}
          <span className="ml-auto text-gray-600 font-mono text-[10px]">{record.id}</span>
        </div>
      </div>
    </article>
  );
}
