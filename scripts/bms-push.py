#!/usr/bin/env python3
"""
BMS Push Script (Python)
------------------------
Sends a BMS lifecycle event to the PowerStarter Command Center.

Usage:
    python scripts/bms-push.py [options]

Options:
    --url URL           Base URL of the PowerStarter app (default: http://localhost:3001)
    --type TYPE         Event type: lifecycle|metric|error|info|warning (default: lifecycle)
    --message MSG       Log message / caption
    --cpu FLOAT         CPU usage 0-100 (default: 0)
    --battery FLOAT     Battery percent 0-100 (default: 100)
    --connection STR    Connection status: online|offline|degraded (default: online)
    --media TYPE        Media slot: graph|unity (default: graph)
    --extra JSON        Additional RootPlanner variables as a JSON object

Examples:
    python scripts/bms-push.py --type lifecycle --message "Engine started" --cpu 12 --battery 95
    python scripts/bms-push.py --type error --message "Thermal limit reached" \\
        --cpu 98 --battery 30 --connection degraded
"""

import argparse
import json
import sys
import time
import urllib.request
import urllib.error
from urllib.parse import urljoin


def parse_args() -> argparse.Namespace:
    p = argparse.ArgumentParser(
        description="Push a BMS event to the PowerStarter Command Center."
    )
    p.add_argument("--url", default="http://localhost:3001", help="Base URL")
    p.add_argument("--type", dest="event_type", default="lifecycle",
                   choices=["lifecycle", "metric", "error", "info", "warning"])
    p.add_argument("--message", default=None, help="Log message / caption")
    p.add_argument("--cpu", type=float, default=0.0, help="CPU usage 0-100")
    p.add_argument("--battery", type=float, default=100.0, help="Battery 0-100")
    p.add_argument("--connection", default="online",
                   choices=["online", "offline", "degraded"])
    p.add_argument("--media", dest="media_type", default="graph",
                   choices=["graph", "unity"])
    p.add_argument("--extra", default="{}", help="Extra state variables as JSON")
    return p.parse_args()


def main() -> None:
    args = parse_args()

    try:
        extra: dict = json.loads(args.extra)
    except json.JSONDecodeError as exc:
        print(f"Warning: --extra is not valid JSON ({exc}); ignoring.", file=sys.stderr)
        extra = {}

    message = args.message or f"BMS event at {time.strftime('%Y-%m-%dT%H:%M:%SZ', time.gmtime())}"

    payload = {
        "type": args.event_type,
        "message": message,
        "mediaType": args.media_type,
        "state": {
            "cpu": args.cpu,
            "battery": args.battery,
            "connection": args.connection,
            "timestamp": int(time.time() * 1000),
            **extra,
        },
    }

    endpoint = urljoin(args.url.rstrip("/") + "/", "api/bms/push")
    data = json.dumps(payload).encode("utf-8")

    req = urllib.request.Request(
        endpoint,
        data=data,
        headers={"Content-Type": "application/json"},
        method="POST",
    )

    try:
        with urllib.request.urlopen(req) as resp:
            body = json.loads(resp.read().decode("utf-8"))
            print(f"✓ Event pushed  id={body['id']}  type={args.event_type}")
    except urllib.error.HTTPError as exc:
        body = exc.read().decode("utf-8")
        print(f"✗ Push failed  status={exc.code}  body={body}", file=sys.stderr)
        sys.exit(1)
    except urllib.error.URLError as exc:
        print(f"✗ Network error: {exc.reason}", file=sys.stderr)
        sys.exit(1)


if __name__ == "__main__":
    main()
