"use client";

/**
 * PublishToggle – interactive "Publish to Community" switch.
 *
 * Renders a labelled toggle button that PATCHes /api/instances/[id] to flip
 * the `isPublic` flag.  Shows optimistic UI while the request is in-flight
 * and surfaces an error message if it fails.
 */

import { useState, useTransition } from "react";

interface PublishToggleProps {
  instanceId: string;
  initialIsPublic: boolean;
  slug: string | null | undefined;
}

export function PublishToggle({
  instanceId,
  initialIsPublic,
  slug,
}: PublishToggleProps) {
  const [isPublic, setIsPublic] = useState(initialIsPublic);
  const [currentSlug, setCurrentSlug] = useState(slug ?? null);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  async function handleToggle() {
    const next = !isPublic;
    setError(null);

    startTransition(async () => {
      try {
        const res = await fetch(`/api/instances/${instanceId}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ isPublic: next }),
        });

        if (!res.ok) {
          const data = (await res.json().catch(() => ({}))) as {
            error?: string;
          };
          setError(data.error ?? "Failed to update visibility.");
          return;
        }

        const updated = (await res.json()) as {
          isPublic?: boolean;
          slug?: string | null;
        };
        setIsPublic(updated.isPublic ?? next);
        setCurrentSlug(updated.slug ?? null);
      } catch {
        setError("Network error. Please try again.");
      }
    });
  }

  return (
    <div className="mt-3 flex flex-col gap-1">
      <button
        type="button"
        onClick={handleToggle}
        disabled={isPending}
        aria-pressed={isPublic}
        className={[
          "flex items-center gap-2 rounded-lg px-3 py-1.5 text-xs font-medium transition-colors",
          "focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2",
          "disabled:cursor-not-allowed disabled:opacity-50",
          isPublic
            ? "bg-emerald-500/20 text-emerald-300 ring-1 ring-emerald-500/40 hover:bg-emerald-500/30"
            : "bg-white/10 text-slate-400 ring-1 ring-white/10 hover:bg-white/15",
        ].join(" ")}
      >
        {/* Toggle knob */}
        <span
          className={[
            "inline-block h-3.5 w-6 flex-shrink-0 rounded-full transition-colors",
            isPublic ? "bg-emerald-400" : "bg-slate-600",
          ].join(" ")}
        >
          <span
            className={[
              "block h-3.5 w-3.5 rounded-full bg-white shadow transition-transform",
              isPublic ? "translate-x-2.5" : "translate-x-0",
            ].join(" ")}
          />
        </span>
        {isPending ? "Updating…" : isPublic ? "Published" : "Publish to Community"}
      </button>

      {/* Shareable link */}
      {isPublic && currentSlug && (
        <p className="truncate text-[10px] text-slate-500">
          /portfolio/{currentSlug}
        </p>
      )}

      {/* Error */}
      {error && (
        <p className="text-[10px] text-red-400" role="alert">
          {error}
        </p>
      )}
    </div>
  );
}
