#!/usr/bin/env python3
"""Block one application deploy until the quality gates recorded for it have succeeded.

The quality workflow decides which changed applications to check and records
quality/<app>/<gate>. This script only reads those results. It does not diff
the previous commit.
"""

from __future__ import annotations

import json
import os
import subprocess
import sys
import time

from medmate_contract import load_projects

POLL_SECONDS = 10
WAIT_BUDGET_SECONDS = 5 * 60


def gh(*args: str) -> str:
    result = subprocess.run(
        ["gh", *args],
        check=True,
        text=True,
        capture_output=True,
    )
    return result.stdout.strip()


def statuses(repository: str, sha: str) -> dict[str, str]:
    payload = json.loads(gh("api", f"repos/{repository}/commits/{sha}/status"))
    latest: dict[str, dict] = {}
    for item in payload.get("statuses") or []:
        context = item.get("context") or ""
        if not context:
            continue
        current = latest.get(context)
        if current is None or (item.get("updated_at") or "") >= (current.get("updated_at") or ""):
            latest[context] = item
    return {context: item.get("state") or "" for context, item in latest.items()}


def main() -> int:
    if len(sys.argv) != 2:
        print("usage: wait_for_quality.py <app>", file=sys.stderr)
        return 2
    app = sys.argv[1]
    project = next((item for item in load_projects() if item["name"] == app), None)
    if project is None:
        print(f"{app}: unknown application", file=sys.stderr)
        return 1
    gates = project.get("quality") or []
    if not gates:
        print(f"{app}: no quality gates", flush=True)
        return 0
    if project.get("errors"):
        for error in project["errors"]:
            print(error, file=sys.stderr)
        return 1

    repository = os.environ["GITHUB_REPOSITORY"]
    sha = os.environ["GITHUB_SHA"]
    wanted = {f"quality/{app}/{gate}": gate for gate in gates}
    deadline = time.monotonic() + WAIT_BUDGET_SECONDS
    while True:
        found = statuses(repository, sha)
        failed = [gate for context, gate in wanted.items() if found.get(context) in {"failure", "error"}]
        if failed:
            print(f"{app}: quality gates failed: {', '.join(failed)}", file=sys.stderr)
            return 1
        recorded = [gate for gate in gates if found.get(f"quality/{app}/{gate}")]
        if not recorded:
            print(f"{app}: no quality gates ran for this publish", flush=True)
            return 0
        pending = [gate for context, gate in wanted.items() if found.get(context) != "success"]
        if not pending:
            print(f"{app}: quality gates passed ({', '.join(gates)})", flush=True)
            return 0
        if time.monotonic() >= deadline:
            print(f"{app}: timed out waiting for quality gates: {', '.join(pending)}", file=sys.stderr)
            return 1
        print(f"{app}: waiting for {', '.join(pending)}", flush=True)
        time.sleep(POLL_SECONDS)


if __name__ == "__main__":
    try:
        raise SystemExit(main())
    except subprocess.CalledProcessError as exc:
        if exc.stderr:
            print(exc.stderr, file=sys.stderr)
        raise SystemExit(exc.returncode or 1)
