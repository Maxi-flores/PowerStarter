#!/usr/bin/env node
/**
 * scripts/bms-push.js
 * ───────────────────
 * Sample Node.js script for Powerframe BMS hardware to securely POST
 * battery metrics to the Powerstarter /api/instances endpoint.
 *
 * USAGE
 * ─────
 *   POWERSTARTER_API_SECRET=<secret> \
 *   POWERSTARTER_BASE_URL=https://therockettree.com \
 *   node scripts/bms-push.js
 *
 * ENVIRONMENT VARIABLES
 * ─────────────────────
 *   POWERSTARTER_API_SECRET   Required. Bearer token set on the server.
 *   POWERSTARTER_BASE_URL     Optional. Defaults to http://localhost:3000.
 *
 * NOTES
 * ─────
 *   • This script uses the Node.js built-in `fetch` (available in Node ≥ 18).
 *     For older runtimes, install `node-fetch` and replace `fetch` with it.
 *   • Replace the `readBmsMetrics()` stub with your actual hardware SDK call.
 *   • Run this on a cron / interval to push readings periodically.
 */

"use strict";

// ---------------------------------------------------------------------------
// Configuration
// ---------------------------------------------------------------------------

const BASE_URL =
  process.env.POWERSTARTER_BASE_URL?.replace(/\/$/, "") ??
  "http://localhost:3000";
const API_SECRET = process.env.POWERSTARTER_API_SECRET;
const ENDPOINT = `${BASE_URL}/api/instances`;

if (!API_SECRET) {
  console.error(
    "[bms-push] POWERSTARTER_API_SECRET is not set.\n" +
      "Export it before running:\n" +
      "  export POWERSTARTER_API_SECRET=<your-secret>"
  );
  process.exit(1);
}

// ---------------------------------------------------------------------------
// Hardware stub – replace with your real BMS SDK calls
// ---------------------------------------------------------------------------

/**
 * Reads current metrics from the Powerframe BMS hardware.
 *
 * Replace this function with your actual SDK / serial / Modbus call.
 * The object must match the BmsMetrics schema (see apps/web/lib/schemas.ts).
 */
function readBmsMetrics() {
  return {
    packVoltage: 48.3,
    packCurrent: -12.5, // negative = discharging
    capacityAh: 100,
    stateOfCharge: 72.4,
    stateOfHealth: 94.1,
    cellCount: 16,
    cellGroups: [
      {
        groupId: "A1",
        minVoltage: 3.01,
        maxVoltage: 3.04,
        avgVoltage: 3.02,
        temperature: 28.5,
      },
      {
        groupId: "A2",
        minVoltage: 3.00,
        maxVoltage: 3.03,
        avgVoltage: 3.01,
        temperature: 29.1,
      },
    ],
    balancingActive: false,
    estimatedRuntimeMin: 240,
  };
}

// ---------------------------------------------------------------------------
// Push function
// ---------------------------------------------------------------------------

async function pushBmsData() {
  const payload = {
    name: "Pack A – Rack 1",      // Change to your instance name
    status: "active",              // "active" | "inactive" | "pending" | "error"
    tags: ["rack-1", "zone-a"],    // Optional free-form tags
    bms: readBmsMetrics(),
  };

  console.log(`[bms-push] POSTing to ${ENDPOINT} …`);

  const response = await fetch(ENDPOINT, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${API_SECRET}`,
    },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    const text = await response.text();
    console.error(
      `[bms-push] Server responded with ${response.status}: ${text}`
    );
    process.exit(1);
  }

  const result = await response.json();
  console.log("[bms-push] Success! Instance recorded:");
  console.log(JSON.stringify(result, null, 2));
}

// ---------------------------------------------------------------------------
// Entry point
// ---------------------------------------------------------------------------

pushBmsData().catch((err) => {
  console.error("[bms-push] Unexpected error:", err);
  process.exit(1);
});
