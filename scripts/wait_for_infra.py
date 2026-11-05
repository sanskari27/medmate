#!/usr/bin/env python3
"""Block application deploy until Infra has finished applying.

Deploy and Infra start together on a push. Terraform writes the SSM parameters
that deploy reads, so a new application fails if it is published while apply is
still running. An app-only push proceeds unless an Infra run is still in progress.
"""

from __future__ import annotations

import json
import os
import subprocess
import sys
import time

WORKFLOW = "infra.yml"
POLL_SECONDS = 15
DISCOVERY_SECONDS = 180
WAIT_BUDGET_SECONDS = 90 * 60
EMPTY_TREE = "4b825dc642cb6eb9a060e54bf8d69288fbee4904"


def gh(*args: str) -> str:
    result = subprocess.run(
        ["gh", *args],
        check=True,
        text=True,
        capture_output=True,
    )
    return result.stdout.strip()


def infra_paths_changed() -> bool | None:
    """Whether this push should have started Infra.

    None means the diff could not be read. The caller then waits only if a run appears.
    """
    if os.environ.get("GITHUB_EVENT_NAME") != "push":
        return False
    before = os.environ.get("BEFORE", "").strip()
    if not before or set(before) <= {"0"}:
        before = EMPTY_TREE
    try:
        output = subprocess.check_output(
            ["git", "diff", "--name-only", before, "HEAD"],
            text=True,
            stderr=subprocess.DEVNULL,
        )
    except subprocess.CalledProcessError:
        print("could not read the push diff; will wait if an Infra run appears", flush=True)
        return None
    for line in output.splitlines():
        path = line.strip()
        if path.startswith("packages/infra/") or path == ".github/workflows/infra.yml":
            return True
    return False


def list_runs() -> list[dict]:
    branch = os.environ.get("GITHUB_REF_NAME", "main")
    raw = gh(
        "run", "list",
        "--workflow", WORKFLOW,
        "--branch", branch,
        "--limit", "30",
        "--json", "databaseId,status,conclusion,headSha,createdAt,url",
    )
    return json.loads(raw or "[]")


def poll(run: dict) -> str:
    run_id = str(run["databaseId"])
    url = run.get("url") or run_id
    print(f"waiting for Infra run {url}", flush=True)
    while True:
        info = json.loads(gh("run", "view", run_id, "--json", "status,conclusion"))
        status = info.get("status") or ""
        if status == "completed":
            return info.get("conclusion") or "failure"
        print(f"Infra run {run_id} is {status}", flush=True)
        time.sleep(POLL_SECONDS)


def fail(run: dict, conclusion: str) -> int:
    print(
        f"Infra run {run.get('url', run['databaseId'])} finished with {conclusion}",
        file=sys.stderr,
    )
    return 1


def main() -> int:
    required = infra_paths_changed()
    sha = os.environ["GITHUB_SHA"]
    deadline = time.monotonic() + DISCOVERY_SECONDS
    started = time.monotonic()

    while True:
        if time.monotonic() - started > WAIT_BUDGET_SECONDS:
            print("timed out waiting for Infra", file=sys.stderr)
            return 1

        runs = list_runs()
        active = [run for run in runs if run.get("status") != "completed"]
        mine = [run for run in runs if run.get("headSha") == sha]

        if required is True and not mine and time.monotonic() < deadline:
            print("waiting for the Infra workflow run to appear", flush=True)
            time.sleep(POLL_SECONDS)
            continue

        if required is None and not mine and not active and time.monotonic() < deadline:
            print("waiting to see whether Infra starts for this commit", flush=True)
            time.sleep(POLL_SECONDS)
            continue

        if active:
            target = min(active, key=lambda run: run.get("createdAt") or "")
            conclusion = poll(target)
            if conclusion != "success":
                return fail(target, conclusion)
            continue

        if required is True and not mine:
            print("infra files changed but no Infra workflow run appeared", file=sys.stderr)
            return 1

        if mine and required is True:
            latest = max(mine, key=lambda run: run.get("createdAt") or "")
            conclusion = latest.get("conclusion") or ""
            if conclusion != "success":
                return fail(latest, conclusion)
            print(f"Infra run {latest['databaseId']} succeeded", flush=True)
            return 0

        print("no Infra run is in progress; deploying", flush=True)
        return 0


if __name__ == "__main__":
    try:
        raise SystemExit(main())
    except subprocess.CalledProcessError as exc:
        if exc.stderr:
            print(exc.stderr, file=sys.stderr)
        raise SystemExit(exc.returncode or 1)
