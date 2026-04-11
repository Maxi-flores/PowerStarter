import type { FeedResponse } from "@/lib/feed-types";

interface ProjectSidebarProps {
  data: FeedResponse;
}

export default function ProjectSidebar({ data }: ProjectSidebarProps) {
  const { plannerActive, totalProcessed, records } = data;

  // Tally theme counts from latest records
  const themeCounts = records.reduce<Record<string, number>>((acc, r) => {
    const t = r.visualState.theme;
    acc[t] = (acc[t] ?? 0) + 1;
    return acc;
  }, {});

  return (
    <aside className="w-full lg:w-72 shrink-0 flex flex-col gap-4">
      {/* ── Project Profile card ────────────────────────────── */}
      <div className="bg-gray-800 rounded-2xl p-5 border border-gray-700">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-600 to-green-500 flex items-center justify-center text-xl font-bold text-white shadow">
            ⚡
          </div>
          <div>
            <h2 className="text-sm font-bold text-white">PowerStarter BMS</h2>
            <p className="text-xs text-gray-400">Battery Management System</p>
          </div>
        </div>

        {/* RootPlanner status */}
        <div className="flex items-center justify-between py-2 border-t border-gray-700">
          <span className="text-xs text-gray-400">RootPlanner</span>
          <span
            className={`flex items-center gap-1.5 text-xs font-semibold ${
              plannerActive ? "text-green-400" : "text-red-400"
            }`}
          >
            <span
              className={`w-2 h-2 rounded-full ${
                plannerActive ? "bg-green-400 animate-pulse" : "bg-red-400"
              }`}
            />
            {plannerActive ? "Active" : "Inactive"}
          </span>
        </div>

        {/* Total metrics */}
        <div className="flex items-center justify-between py-2 border-t border-gray-700">
          <span className="text-xs text-gray-400">Total Metrics Processed</span>
          <span className="text-xs font-bold text-white tabular-nums">
            {totalProcessed.toLocaleString()}
          </span>
        </div>
      </div>

      {/* ── Theme breakdown card ────────────────────────────── */}
      <div className="bg-gray-800 rounded-2xl p-5 border border-gray-700">
        <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-3">
          State Breakdown (latest 20)
        </h3>
        <ul className="space-y-2">
          {Object.entries(themeCounts).map(([theme, count]) => (
            <li key={theme} className="flex items-center justify-between text-sm">
              <span className="capitalize text-gray-300">{theme}</span>
              <div className="flex items-center gap-2">
                <div className="h-1.5 rounded-full bg-gray-600 w-20 overflow-hidden">
                  <div
                    className={`h-full rounded-full ${THEME_BAR[theme] ?? "bg-gray-500"}`}
                    style={{ width: `${(count / records.length) * 100}%` }}
                  />
                </div>
                <span className="text-gray-400 text-xs w-4 text-right">{count}</span>
              </div>
            </li>
          ))}
        </ul>
      </div>

      {/* ── Push tip card ────────────────────────────────────── */}
      <div className="bg-gray-800/50 rounded-2xl p-4 border border-gray-700 text-xs text-gray-500 leading-relaxed">
        <p className="font-semibold text-gray-400 mb-1">Push a new record</p>
        <code className="block bg-gray-900 rounded p-2 text-green-400 overflow-x-auto text-[10px] leading-normal">
          POST /api/feed
        </code>
        <p className="mt-2">
          Send a <span className="text-gray-300">VisualStateRecord</span> JSON body to add a new post to the feed.
        </p>
      </div>
    </aside>
  );
}

const THEME_BAR: Record<string, string> = {
  normal: "bg-green-500",
  charging: "bg-blue-500",
  warning: "bg-amber-500",
  fault: "bg-red-500",
  idle: "bg-gray-500",
};
