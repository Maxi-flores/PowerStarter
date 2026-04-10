#!/usr/bin/env python3
"""
scripts/bms-push.py
───────────────────
Sample Python script for Powerframe BMS hardware to securely POST
battery metrics to the Powerstarter /api/instances endpoint.

USAGE
─────
    POWERSTARTER_API_SECRET=<secret> \\
    POWERSTARTER_BASE_URL=https://therockettree.com \\
    python3 scripts/bms-push.py

ENVIRONMENT VARIABLES
─────────────────────
    POWERSTARTER_API_SECRET   Required. Bearer token set on the server.
    POWERSTARTER_BASE_URL     Optional. Defaults to http://localhost:3000.

DEPENDENCIES
────────────
    pip install requests

NOTES
─────
    • Replace the `read_bms_metrics()` stub with your actual hardware SDK call
      (serial, Modbus, CAN bus, etc.).
    • Run this script from a cron job or a systemd timer for periodic pushes.
    • Python 3.7+ is required.
"""

from __future__ import annotations

import json
import os
import sys

try:
    import requests
except ImportError:
    print(
        "[bms-push] The 'requests' library is required.\n"
        "Install it with:  pip install requests",
        file=sys.stderr,
    )
    sys.exit(1)

# ---------------------------------------------------------------------------
# Configuration
# ---------------------------------------------------------------------------

BASE_URL: str = os.environ.get("POWERSTARTER_BASE_URL", "http://localhost:3000").rstrip("/")
API_SECRET: str | None = os.environ.get("POWERSTARTER_API_SECRET")
ENDPOINT: str = f"{BASE_URL}/api/instances"

if not API_SECRET:
    print(
        "[bms-push] POWERSTARTER_API_SECRET is not set.\n"
        "Export it before running:\n"
        "  export POWERSTARTER_API_SECRET=<your-secret>",
        file=sys.stderr,
    )
    sys.exit(1)

# ---------------------------------------------------------------------------
# Hardware stub – replace with your real BMS SDK calls
# ---------------------------------------------------------------------------

def read_bms_metrics() -> dict:
    """
    Read current metrics from the Powerframe BMS hardware.

    Replace this function with your actual SDK / serial / Modbus call.
    The returned dict must match the BmsMetrics schema
    (see apps/web/lib/schemas.ts for the full field list).
    """
    return {
        "packVoltage": 48.3,
        "packCurrent": -12.5,   # negative = discharging
        "capacityAh": 100.0,
        "stateOfCharge": 72.4,
        "stateOfHealth": 94.1,
        "cellCount": 16,
        "cellGroups": [
            {
                "groupId": "A1",
                "minVoltage": 3.01,
                "maxVoltage": 3.04,
                "avgVoltage": 3.02,
                "temperature": 28.5,
            },
            {
                "groupId": "A2",
                "minVoltage": 3.00,
                "maxVoltage": 3.03,
                "avgVoltage": 3.01,
                "temperature": 29.1,
            },
        ],
        "balancingActive": False,
        "estimatedRuntimeMin": 240.0,
    }

# ---------------------------------------------------------------------------
# Push function
# ---------------------------------------------------------------------------

def push_bms_data() -> None:
    payload = {
        "name": "Pack A – Rack 1",      # Change to your instance name
        "status": "active",              # "active" | "inactive" | "pending" | "error"
        "tags": ["rack-1", "zone-a"],    # Optional free-form tags
        "bms": read_bms_metrics(),
    }

    headers = {
        "Content-Type": "application/json",
        "Authorization": f"Bearer {API_SECRET}",
    }

    print(f"[bms-push] POSTing to {ENDPOINT} …")

    try:
        response = requests.post(
            ENDPOINT,
            headers=headers,
            data=json.dumps(payload),
            timeout=30,
        )
    except requests.exceptions.RequestException as exc:
        print(f"[bms-push] Network error: {exc}", file=sys.stderr)
        sys.exit(1)

    if not response.ok:
        print(
            f"[bms-push] Server responded with {response.status_code}: {response.text}",
            file=sys.stderr,
        )
        sys.exit(1)

    result = response.json()
    print("[bms-push] Success! Instance recorded:")
    print(json.dumps(result, indent=2))

# ---------------------------------------------------------------------------
# Entry point
# ---------------------------------------------------------------------------

if __name__ == "__main__":
    push_bms_data()
