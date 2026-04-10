/**
 * /portfolio/[slug] – Shareable portfolio instance page.
 *
 * Fetches a single published instance by its URL-safe `slug` and renders
 * it with full detail.  Also exports `generateMetadata` so that social
 * platforms receive an Open Graph preview card showing the instance's
 * Unity Level and BMS Health.
 *
 * Only publicly visible instances (isPublic = true) are accessible here.
 * Unpublished or non-existent slugs result in a 404 page.
 */

import { notFound } from "next/navigation";
import Link from "next/link";
import type { Metadata } from "next";
import { prisma, fromJson } from "@powerstarter/database";
import type {
  InstanceResult,
  BmsMetrics,
  UnityDisplayData,
} from "@ui/src/types/instance-result";
import type { Instance } from "@prisma/client";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface PageProps {
  params: { slug: string };
}

// ---------------------------------------------------------------------------
// Data helper
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

async function fetchPublicInstance(slug: string): Promise<InstanceResult | null> {
  const row = await prisma.instance.findFirst({
    where: { slug, isPublic: true },
  });
  return row ? rowToInstanceResult(row) : null;
}

// ---------------------------------------------------------------------------
// Dynamic metadata (Open Graph + Twitter Card)
// ---------------------------------------------------------------------------

export async function generateMetadata(
  { params }: PageProps
): Promise<Metadata> {
  const instance = await fetchPublicInstance(params.slug);

  if (!instance) {
    return { title: "Instance not found" };
  }

  const level = instance.unity?.level ?? "–";
  const health = instance.bms?.stateOfHealth?.toFixed(1) ?? "–";
  const soc = instance.bms?.stateOfCharge?.toFixed(1) ?? "–";
  const score = instance.unity?.score ?? "–";

  const title = `${instance.name} · PowerStarter`;
  const description =
    `Unity Level ${level} · Score ${score} · BMS Health ${health}% · SoC ${soc}%`;

  const siteUrl =
    process.env.NEXT_PUBLIC_SITE_URL ?? "https://therockettree.com";
  const pageUrl = `${siteUrl}/portfolio/${params.slug}`;

  return {
    title,
    description,
    openGraph: {
      type: "website",
      url: pageUrl,
      title,
      description,
      siteName: "PowerStarter",
    },
    twitter: {
      card: "summary",
      title,
      description,
    },
    alternates: { canonical: pageUrl },
  };
}

// ---------------------------------------------------------------------------
// Sub-components (server-safe, no "use client")
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

function StatRow({
  label,
  value,
}: {
  label: string;
  value: string | number;
}) {
  return (
    <>
      <dt className="text-slate-500">{label}</dt>
      <dd className="text-right font-mono text-slate-200">{value}</dd>
    </>
  );
}

function BmsCard({ bms }: { bms: BmsMetrics }) {
  return (
    <section className="rounded-xl border border-white/10 bg-white/5 p-5">
      <h2 className="mb-3 text-[10px] font-semibold uppercase tracking-widest text-slate-500">
        BMS Metrics
      </h2>
      <dl className="grid grid-cols-2 gap-x-4 gap-y-1 text-xs">
        <StatRow label="State of Charge" value={`${bms.stateOfCharge.toFixed(1)} %`} />
        <StatRow label="State of Health" value={`${bms.stateOfHealth.toFixed(1)} %`} />
        <StatRow label="Pack Voltage" value={`${bms.packVoltage.toFixed(2)} V`} />
        <StatRow label="Pack Current" value={`${bms.packCurrent.toFixed(2)} A`} />
        <StatRow label="Capacity" value={`${bms.capacityAh.toFixed(1)} Ah`} />
        <StatRow label="Cell Count" value={bms.cellCount} />
        <StatRow label="Runtime Est." value={`${bms.estimatedRuntimeMin.toFixed(0)} min`} />
        <StatRow label="Balancing" value={bms.balancingActive ? "active" : "off"} />
      </dl>
    </section>
  );
}

function UnityCard({ unity }: { unity: UnityDisplayData }) {
  return (
    <section className="rounded-xl border border-white/10 bg-white/5 p-5">
      <h2 className="mb-3 text-[10px] font-semibold uppercase tracking-widest text-slate-500">
        Unity Display
      </h2>
      <dl className="grid grid-cols-2 gap-x-4 gap-y-1 text-xs">
        <StatRow label="Level" value={unity.level} />
        <StatRow label="Score" value={unity.score} />
        <StatRow label="Health" value={unity.health} />
        <StatRow label="Display Name" value={unity.displayName} />
        <StatRow
          label="Position"
          value={`(${unity.position.x.toFixed(1)}, ${unity.position.y.toFixed(1)}, ${unity.position.z.toFixed(1)})`}
        />
      </dl>
    </section>
  );
}

// ---------------------------------------------------------------------------
// Page
// ---------------------------------------------------------------------------

export default async function PortfolioSlugPage({ params }: PageProps) {
  const instance = await fetchPublicInstance(params.slug);

  if (!instance) {
    notFound();
  }

  const updatedAt = new Date(instance.updatedAt).toLocaleString("en-GB", {
    dateStyle: "long",
    timeStyle: "short",
  });

  return (
    <main className="min-h-screen bg-[#0a0a0a] px-4 py-10 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-3xl">
        {/* Header */}
        <header className="mb-8">
          <div className="flex flex-wrap items-center gap-3">
            <h1 className="text-2xl font-bold tracking-tight text-white">
              {instance.name}
            </h1>
            <StatusBadge status={instance.status} />
          </div>
          <p className="mt-1 text-sm text-slate-500">Last updated {updatedAt}</p>
          {instance.tags && instance.tags.length > 0 && (
            <div className="mt-2 flex flex-wrap gap-1">
              {instance.tags.map((tag) => (
                <span
                  key={tag}
                  className="rounded-full bg-white/10 px-2 py-0.5 text-[10px] text-slate-400"
                >
                  {tag}
                </span>
              ))}
            </div>
          )}
        </header>

        {/* Stats grid */}
        <div className="grid gap-4 sm:grid-cols-2">
          {instance.unity && <UnityCard unity={instance.unity} />}
          {instance.bms && <BmsCard bms={instance.bms} />}
        </div>

        {/* Back link */}
        <footer className="mt-8">
          <Link
            href="/portfolio"
            className="text-sm text-slate-500 hover:text-slate-300 transition-colors"
          >
            ← Back to Live Feed
          </Link>
        </footer>
      </div>
    </main>
  );
}
