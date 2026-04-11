import RootControlHeader from "../components/RootControlHeader";
import BmsFeed from "../components/BmsFeed";

/**
 * BMS Command Center — main page.
 *
 * Layout:
 *   - RootControlHeader (sticky) — Live system stats from RootPlanner
 *   - BmsFeed           — Instagram-style real-time lifecycle event feed
 */
export default function CommandCenterPage() {
  return (
    <main className="min-h-screen bg-zinc-950 text-zinc-100">
      <RootControlHeader />
      <BmsFeed />
    </main>
  );
}
