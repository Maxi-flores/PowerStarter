"use client";

import { useEffect, useState, useCallback } from "react";
import type { FeedResponse, VisualStateRecord } from "@/lib/feed-types";
import FeedCard from "./FeedCard";

const POLL_INTERVAL_MS = 30_000;

interface FeedListProps {
  initial: FeedResponse;
}

export default function FeedList({ initial }: FeedListProps) {
  const [records, setRecords] = useState<VisualStateRecord[]>(initial.records);
  const [lastUpdated, setLastUpdated] = useState<Date>(new Date());
  const [refreshing, setRefreshing] = useState(false);

  const refresh = useCallback(async () => {
    setRefreshing(true);
    try {
      const res = await fetch("/api/feed", { cache: "no-store" });
      if (res.ok) {
        const data: FeedResponse = await res.json();
        setRecords(data.records);
        setLastUpdated(new Date());
      }
    } finally {
      setRefreshing(false);
    }
  }, []);

  // Auto-poll
  useEffect(() => {
    const id = setInterval(refresh, POLL_INTERVAL_MS);
    return () => clearInterval(id);
  }, [refresh]);

  return (
    <section className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold text-white">Latest Activity</h2>
        <div className="flex items-center gap-2">
          <span className="text-xs text-gray-500">
            Updated {lastUpdated.toLocaleTimeString()}
          </span>
          <button
            onClick={refresh}
            disabled={refreshing}
            className="px-3 py-1 text-xs rounded-lg bg-gray-700 hover:bg-gray-600 text-gray-300 disabled:opacity-50 transition-colors"
          >
            {refreshing ? "↻ Refreshing…" : "↻ Refresh"}
          </button>
        </div>
      </div>

      {records.length === 0 ? (
        <p className="text-center text-gray-500 py-16">No records yet. Push BMS data to get started.</p>
      ) : (
        records.map((rec) => <FeedCard key={rec.id} record={rec} />)
      )}
    </section>
  );
}
