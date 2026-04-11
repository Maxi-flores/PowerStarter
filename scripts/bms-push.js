#!/usr/bin/env node
/**
 * BMS Push Script (Node.js)
 * -------------------------
 * Sends a BMS lifecycle event to the PowerStarter Command Center.
 *
 * Usage:
 *   node scripts/bms-push.js [options]
 *
 * Options:
 *   --url <url>           Base URL of the PowerStarter app (default: http://localhost:3001)
 *   --type <type>         Event type: lifecycle|metric|error|info|warning (default: lifecycle)
 *   --message <msg>       Log message / caption
 *   --cpu <0-100>         CPU usage percent (default: 0)
 *   --battery <0-100>     Battery percent (default: 100)
 *   --connection <str>    Connection status: online|offline|degraded (default: online)
 *   --media <type>        Media slot: graph|unity (default: graph)
 *   --extra <json>        Additional RootPlanner variables as JSON object
 *
 * Examples:
 *   node scripts/bms-push.js --type lifecycle --message "Engine started" --cpu 12 --battery 95
 *   node scripts/bms-push.js --type error --message "Thermal limit reached" --cpu 98 --battery 30 --connection degraded
 */

const https = require("https");
const http = require("http");
const { URL } = require("url");

// ── Parse CLI args ───────────────────────────────────────────────────────────
const args = process.argv.slice(2);

function getArg(flag, defaultValue) {
  const idx = args.indexOf(flag);
  return idx !== -1 && args[idx + 1] !== undefined ? args[idx + 1] : defaultValue;
}

const baseUrl    = getArg("--url", "http://localhost:3001");
const type       = getArg("--type", "lifecycle");
const message    = getArg("--message", `BMS event at ${new Date().toISOString()}`);
const cpu        = Number(getArg("--cpu", "0"));
const battery    = Number(getArg("--battery", "100"));
const connection = getArg("--connection", "online");
const mediaType  = getArg("--media", "graph");
const extraRaw   = getArg("--extra", "{}");

let extra = {};
try {
  extra = JSON.parse(extraRaw);
} catch {
  console.error("Warning: --extra could not be parsed as JSON; ignoring.");
}

const payload = JSON.stringify({
  type,
  message,
  mediaType,
  state: { cpu, battery, connection, timestamp: Date.now(), ...extra },
});

// ── POST to /api/bms/push ────────────────────────────────────────────────────
const target = new URL("/api/bms/push", baseUrl);
const transport = target.protocol === "https:" ? https : http;

const options = {
  hostname: target.hostname,
  port: target.port || (target.protocol === "https:" ? 443 : 80),
  path: target.pathname,
  method: "POST",
  headers: {
    "Content-Type": "application/json",
    "Content-Length": Buffer.byteLength(payload),
  },
};

const req = transport.request(options, (res) => {
  let body = "";
  res.on("data", (chunk) => (body += chunk));
  res.on("end", () => {
    if (res.statusCode === 201) {
      const data = JSON.parse(body);
      console.log(`✓ Event pushed  id=${data.id}  type=${type}`);
    } else {
      console.error(`✗ Push failed  status=${res.statusCode}  body=${body}`);
      process.exitCode = 1;
    }
  });
});

req.on("error", (err) => {
  console.error(`✗ Network error: ${err.message}`);
  process.exitCode = 1;
});

req.write(payload);
req.end();
