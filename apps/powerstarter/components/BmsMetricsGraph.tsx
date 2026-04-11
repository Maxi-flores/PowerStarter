"use client";

interface BmsMetricsGraphProps {
  cpuHistory: number[];
  batteryHistory: number[];
  /** Width of the SVG in px */
  width?: number;
  /** Height of the SVG in px */
  height?: number;
}

const DEFAULT_CPU = 0;
const DEFAULT_BATTERY = 100;

function buildPath(values: number[], w: number, h: number): string {
  if (values.length < 2) return "";
  const step = w / (values.length - 1);
  return values
    .map((v, i) => {
      const x = i * step;
      const y = h - (v / 100) * h;
      return `${i === 0 ? "M" : "L"}${x.toFixed(1)},${y.toFixed(1)}`;
    })
    .join(" ");
}

/**
 * Renders a dual-line SVG sparkline showing CPU (cyan) and Battery (green)
 * history.  Used as the media slot in each BmsPost when mediaType === "graph".
 */
export default function BmsMetricsGraph({
  cpuHistory,
  batteryHistory,
  width = 468,
  height = 280,
}: BmsMetricsGraphProps) {
  const cpuPath = buildPath(cpuHistory, width, height);
  const batteryPath = buildPath(batteryHistory, width, height);

  const latestCpu = cpuHistory.at(-1) ?? DEFAULT_CPU;
  const latestBattery = batteryHistory.at(-1) ?? DEFAULT_BATTERY;

  return (
    <div className="relative w-full bg-zinc-900 overflow-hidden" style={{ aspectRatio: `${width}/${height}` }}>
      <svg
        viewBox={`0 0 ${width} ${height}`}
        className="w-full h-full"
        preserveAspectRatio="none"
      >
        {/* Grid lines */}
        {[25, 50, 75].map((pct) => (
          <line
            key={pct}
            x1={0}
            y1={height - (pct / 100) * height}
            x2={width}
            y2={height - (pct / 100) * height}
            stroke="#27272a"
            strokeWidth="1"
          />
        ))}

        {/* Battery fill area */}
        {batteryHistory.length >= 2 && (
          <path
            d={`${batteryPath} L${width},${height} L0,${height} Z`}
            fill="rgba(34,197,94,0.08)"
          />
        )}

        {/* CPU fill area */}
        {cpuHistory.length >= 2 && (
          <path
            d={`${cpuPath} L${width},${height} L0,${height} Z`}
            fill="rgba(6,182,212,0.10)"
          />
        )}

        {/* Battery line */}
        {batteryHistory.length >= 2 && (
          <path d={batteryPath} fill="none" stroke="#22c55e" strokeWidth="2" />
        )}

        {/* CPU line */}
        {cpuHistory.length >= 2 && (
          <path d={cpuPath} fill="none" stroke="#06b6d4" strokeWidth="2" />
        )}

        {/* Latest value dots */}
        {cpuHistory.length >= 1 && (
          <circle
            cx={width}
            cy={height - (latestCpu / 100) * height}
            r="4"
            fill="#06b6d4"
          />
        )}
        {batteryHistory.length >= 1 && (
          <circle
            cx={width}
            cy={height - (latestBattery / 100) * height}
            r="4"
            fill="#22c55e"
          />
        )}
      </svg>

      {/* Legend overlay */}
      <div className="absolute bottom-2 left-3 flex gap-4 text-[11px] font-mono">
        <span className="flex items-center gap-1 text-cyan-400">
          <span className="inline-block h-0.5 w-4 bg-cyan-400 rounded" />
          CPU {latestCpu}%
        </span>
        <span className="flex items-center gap-1 text-green-400">
          <span className="inline-block h-0.5 w-4 bg-green-400 rounded" />
          BATT {latestBattery}%
        </span>
      </div>
    </div>
  );
}
