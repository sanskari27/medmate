#!/usr/bin/env python3
"""Write the quality-gate matrix for the current commit.

APPS, when set, is a JSON list of application names from the deploy workflow.
Otherwise the script diffs BASE_SHA against HEAD. An application is included
only when its project.yaml turns a gate on.
"""

from __future__ import annotations

import json
import os
import subprocess
import sys

from medmate_contract import JAVA_VERSION, load_projects, quality_commands, repo_root, validate_projects

WATCHED = (
    ".github/workflows/quality.yml",
    "scripts/list_quality_gates.py",
    "scripts/medmate_contract.py",
    "scripts/wait_for_quality.py",
)

NONE = {
    "app": "-",
    "gate": "none",
    "kind": "react",
    "runtime": "node",
    "directory": ".",
    "command": "true",
    "install": "true",
    "nodeVersion": "22",
    "javaVersion": JAVA_VERSION,
}


def changed_files() -> list[str] | None:
    """Changed paths, or None when every application should be considered."""
    before = os.environ.get("BASE_SHA", "").strip()
    if not before or set(before) <= {"0"}:
        return None
    try:
        output = subprocess.check_output(
            ["git", "diff", "--name-only", before, "HEAD"],
            cwd=repo_root(),
            text=True,
            stderr=subprocess.DEVNULL,
        )
    except subprocess.CalledProcessError:
        return None
    return [line.strip() for line in output.splitlines() if line.strip()]


def selected_names(projects: list[dict]) -> list[str]:
    raw = os.environ.get("APPS", "").strip()
    known = [project["name"] for project in projects]
    if raw:
        parsed = json.loads(raw)
        if not isinstance(parsed, list) or not all(isinstance(item, str) for item in parsed):
            raise SystemExit("APPS must be a JSON list of application names")
        unknown = sorted(set(parsed) - set(known))
        if unknown:
            raise SystemExit(f"unknown applications: {', '.join(unknown)}")
        return [name for name in known if name in parsed]

    files = changed_files()
    if files is None or any(path in WATCHED or path.startswith("scripts/") for path in files):
        return known
    selected = []
    for name in known:
        prefix = f"packages/apps/{name}/"
        if any(path.startswith(prefix) for path in files):
            selected.append(name)
    return selected


def entries(projects: list[dict], names: list[str]) -> list[dict]:
    by_name = {project["name"]: project for project in projects}
    rows = []
    for name in names:
        project = by_name[name]
        kind = project.get("kind") or ""
        commands = quality_commands(kind)
        work = project.get("build", {}).get("workingDirectory", ".")
        directory = f"packages/apps/{name}" if work == "." else f"packages/apps/{name}/{work}"
        runtime = "java" if kind == "java" else "node"
        for gate in project.get("quality") or []:
            rows.append({
                "app": name,
                "gate": gate,
                "kind": kind,
                "runtime": runtime,
                "directory": directory,
                "command": commands[gate],
                "install": project["build"]["install"] if runtime == "node" else "",
                "nodeVersion": project["build"]["nodeVersion"],
                "javaVersion": JAVA_VERSION,
            })
    return rows


def write_output(gates: list[dict]) -> None:
    payload = json.dumps(gates)
    path = os.environ.get("GITHUB_OUTPUT")
    if not path:
        print(payload)
        return
    with open(path, "a", encoding="utf-8") as handle:
        handle.write(f"count={len(gates)}\n")
        handle.write("gates<<EOF\n")
        handle.write(payload + "\n")
        handle.write("EOF\n")


def main() -> int:
    errors = validate_projects()
    if errors:
        for error in errors:
            print(error, file=sys.stderr)
        return 1
    projects = load_projects()
    gates = entries(projects, selected_names(projects))
    write_output(gates or [NONE])
    print(f"{len(gates)} quality gates", flush=True)
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
