import { getLatestRecords, getTotalProcessed, isPlannerActive } from "@/lib/feed-store";
import type { FeedResponse } from "@/lib/feed-types";
import FeedList from "./FeedList";
import ProjectSidebar from "./ProjectSidebar";

export const dynamic = "force-dynamic";
export const revalidate = 0;

function getFeedData(): FeedResponse {
  // Direct import from the in-memory store (same Node.js process).
  // When @trt/db is available, swap this for a Prisma/ORM query.
  return {
    records: getLatestRecords(20),
    totalProcessed: getTotalProcessed(),
    plannerActive: isPlannerActive(),
  };
}

export default function FeedPage() {
  const data = getFeedData();

  return (
    <div className="min-h-screen bg-gray-950 text-white">
      {/* ── Top nav ────────────────────────────────────────────────── */}
      <header className="sticky top-0 z-10 bg-gray-900/80 backdrop-blur border-b border-gray-800">
        <div className="max-w-5xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-lg font-bold tracking-tight">⚡ PowerStarter</span>
            <span className="text-xs text-gray-500 hidden sm:inline">/ BMS Feed</span>
          </div>
          <span className="text-xs text-gray-500">
            {data.records.length} latest records
          </span>
        </div>
      </header>

      {/* ── Main layout ────────────────────────────────────────────── */}
      <main className="max-w-5xl mx-auto px-4 py-8">
        <div className="flex flex-col lg:flex-row gap-8 items-start">
          {/* Feed (centre) */}
          <div className="flex-1 min-w-0">
            <FeedList initial={data} />
          </div>

          {/* Sidebar (right) */}
          <ProjectSidebar data={data} />
        </div>
      </main>
    </div>
  );
}
