/**
 * /portfolio – Live Feed of Powerstarter instance results.
 *
 * Server Component: fetches all instances directly from the database via
 * Prisma and renders them as a live feed grid.  No client-side JS is
 * required – the page re-validates on every request (no caching) so that
 * the Unity game interface and the BMS always see the latest data.
 */

import type { Metadata } from "next";
import { prisma, fromJson } from "@powerstarter/database";
import type { Instance } from "@prisma/client";
import type {
  InstanceResult,
  BmsMetrics,
  UnityDisplayData,
} from "@ui/src/types/instance-result";
import { PublishToggle } from "./PublishToggle";

// ---------------------------------------------------------------------------
// Metadata
// ---------------------------------------------------------------------------

export const metadata: Metadata = {
  title: "Portfolio Live Feed",
  description:
    "Real-time feed of automated Powerframe BMS instance results for the Powerstarter portfolio.",
};

// Next.js: opt out of caching so each request hits the database fresh.
export const dynamic = "force-dynamic";

// ---------------------------------------------------------------------------
// Data helpers
// ---------------------------------------------------------------------------

function rowToInstanceResult(row: Instance): InstanceResult {
  return {
    id: row.id,
    name: row.name,
    status: row.status,
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
    bms: fromJson<BmsMetrics>(row.bms),
    unity: fromJson<UnityDisplayData>(row.unity),
    tags: row.tags,
    isPublic: row.isPublic,
    slug: row.slug,
  };
}

async function fetchInstances(): Promise<InstanceResult[]> {
  const rows = await prisma.instance.findMany({
    orderBy: { updatedAt: "desc" },
  });
  return rows.map(rowToInstanceResult);
}

// ---------------------------------------------------------------------------
// Sub-components (pure presentational, no "use client" needed)
// ---------------------------------------------------------------------------

function StatusBadge({ status }: { status: InstanceResult["status"] }) {
  const colours: Record<InstanceResult["status"], string> = {
    active: "bg-emerald-500/20 text-emerald-400 ring-emerald-500/40",
    inactive: "bg-slate-500/20 text-slate-400 ring-slate-500/40",
    pending: "bg-amber-500/20 text-amber-400 ring-amber-500/40",
    error: "bg-red-500/20 text-red-400 ring-red-500/40",
  };

  return (
    <span
      className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ring-1 ring-inset ${colours[status]}`}
    >
      {status}
    </span>
  );
}

function BmsPanel({ bms }: { bms: BmsMetrics }) {
  return (
    <dl className="mt-3 grid grid-cols-2 gap-x-4 gap-y-1 text-xs text-slate-300">
      <dt className="text-slate-500">SoC</dt>
      <dd className="text-right font-mono">{bms.stateOfCharge.toFixed(1)} %</dd>

      <dt className="text-slate-500">SoH</dt>
      <dd className="text-right font-mono">{bms.stateOfHealth.toFixed(1)} %</dd>

      <dt className="text-slate-500">Voltage</dt>
      <dd className="text-right font-mono">{bms.packVoltage.toFixed(2)} V</dd>

      <dt className="text-slate-500">Current</dt>
      <dd className="text-right font-mono">{bms.packCurrent.toFixed(2)} A</dd>

      <dt className="text-slate-500">Runtime</dt>
      <dd className="text-right font-mono">
        {bms.estimatedRuntimeMin.toFixed(0)} min
      </dd>

      <dt className="text-slate-500">Balancing</dt>
      <dd className="text-right font-mono">
        {bms.balancingActive ? "active" : "off"}
      </dd>
    </dl>
  );
}

function UnityPanel({ unity }: { unity: UnityDisplayData }) {
  return (
    <dl className="mt-3 grid grid-cols-2 gap-x-4 gap-y-1 text-xs text-slate-300">
      <dt className="text-slate-500">Health</dt>
      <dd className="text-right font-mono">{unity.health}</dd>

      <dt className="text-slate-500">Score</dt>
      <dd className="text-right font-mono">{unity.score}</dd>

      <dt className="text-slate-500">Level</dt>
      <dd className="text-right font-mono">{unity.level}</dd>
    </dl>
  );
}

function InstanceCard({ instance }: { instance: InstanceResult }) {
  const updatedAt = new Date(instance.updatedAt).toLocaleString("en-GB", {
    dateStyle: "medium",
    timeStyle: "short",
  });

  return (
    <article className="flex flex-col gap-3 rounded-xl border border-white/10 bg-white/5 p-5 shadow-sm backdrop-blur-sm">
      {/* Header */}
      <header className="flex items-start justify-between gap-2">
        <h2 className="text-sm font-semibold text-white">{instance.name}</h2>
        <StatusBadge status={instance.status} />
      </header>

      {/* BMS section */}
      {instance.bms && (
        <section>
          <h3 className="text-[10px] font-semibold uppercase tracking-widest text-slate-500">
            BMS Metrics
          </h3>
          <BmsPanel bms={instance.bms} />
        </section>
      )}

      {/* Unity section */}
      {instance.unity && (
        <section>
          <h3 className="text-[10px] font-semibold uppercase tracking-widest text-slate-500">
            Unity Display
          </h3>
          <UnityPanel unity={instance.unity} />
        </section>
      )}

      {/* Tags */}
      {instance.tags && instance.tags.length > 0 && (
        <footer className="flex flex-wrap gap-1">
          {instance.tags.map((tag) => (
            <span
              key={tag}
              className="rounded-full bg-white/10 px-2 py-0.5 text-[10px] text-slate-400"
            >
              {tag}
            </span>
          ))}
        </footer>
      )}

      {/* Publish toggle */}
      <PublishToggle
        instanceId={instance.id}
        initialIsPublic={instance.isPublic ?? false}
        slug={instance.slug}
      />

      {/* Timestamp */}
      <p className="mt-auto text-[10px] text-slate-600">Updated {updatedAt}</p>
    </article>
  );
}

// ---------------------------------------------------------------------------
// Page
// ---------------------------------------------------------------------------

export default async function PortfolioPage() {
  const instances = await fetchInstances();

  return (
    <main className="min-h-screen bg-[#0a0a0a] px-4 py-10 sm:px-6 lg:px-8">
      {/* Page header */}
      <header className="mx-auto max-w-7xl mb-10">
        <div className="flex items-center gap-3">
          {/* Live indicator */}
          <span className="relative flex h-2.5 w-2.5">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
            <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-emerald-500" />
          </span>
          <h1 className="text-xl font-bold tracking-tight text-white">
            Live Feed
          </h1>
          <span className="ml-auto text-sm text-slate-500">
            {instances.length} instance{instances.length !== 1 ? "s" : ""}
          </span>
        </div>
        <p className="mt-2 text-sm text-slate-400">
          Automated Powerframe BMS results streamed from the calculation engine.
        </p>
      </header>

      {/* Feed grid */}
      {instances.length === 0 ? (
        <div className="mx-auto max-w-7xl rounded-xl border border-dashed border-white/10 p-12 text-center text-slate-500">
          No instance results yet. Send a POST request to{" "}
          <code className="rounded bg-white/5 px-1 py-0.5 font-mono text-xs">
            /api/instances
          </code>{" "}
          from the Powerframe BMS to populate the feed.
        </div>
      ) : (
        <ul className="mx-auto grid max-w-7xl grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {instances.map((instance) => (
            <li key={instance.id}>
              <InstanceCard instance={instance} />
            </li>
          ))}
        </ul>
      )}
    </main>
  );
}
