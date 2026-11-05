#!/usr/bin/env python3
"""Write the quality-gate matrix for applications whose files changed.

APPS, when set, is a JSON list from the deploy workflow. It can only narrow
the set. A gate runs when that application's directory is in the diff and its
project.yaml turns the gate on.
"""

from __future__ import annotations

import json
import os
import subprocess
import sys

from medmate_contract import JAVA_VERSION, load_projects, quality_commands, repo_root, validate_projects

EMPTY_TREE = "4b825dc642cb6eb9a060e54bf8d69288fbee4904"
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


def comparison_base() -> str | None:
    """Commit to diff against, or None when this event has no app diff."""
    before = os.environ.get("BASE_SHA", "").strip()
    event = os.environ.get("GITHUB_EVENT_NAME", "")
    if event == "push" and (not before or set(before) <= {"0"}):
        return EMPTY_TREE
    if not before or set(before) <= {"0"}:
        return None
    return before


def changed_app_names(known: list[str]) -> list[str]:
    before = comparison_base()
    if before is None:
        return []
    try:
        output = subprocess.check_output(
            ["git", "diff", "--name-only", before, "HEAD"],
            cwd=repo_root(),
            text=True,
            stderr=subprocess.DEVNULL,
        )
    except subprocess.CalledProcessError as exc:
        raise SystemExit(f"could not diff {before}..HEAD") from exc
    files = [line.strip() for line in output.splitlines() if line.strip()]
    selected = []
    for name in known:
        prefix = f"packages/apps/{name}/"
        if any(path.startswith(prefix) for path in files):
            selected.append(name)
    return selected


def selected_names(projects: list[dict]) -> list[str]:
    known = [project["name"] for project in projects]
    names = changed_app_names(known)
    raw = os.environ.get("APPS", "").strip()
    if not raw:
        return names
    parsed = json.loads(raw)
    if not isinstance(parsed, list) or not all(isinstance(item, str) for item in parsed):
        raise SystemExit("APPS must be a JSON list of application names")
    unknown = sorted(set(parsed) - set(known))
    if unknown:
        raise SystemExit(f"unknown applications: {', '.join(unknown)}")
    allowed = set(parsed)
    return [name for name in names if name in allowed]


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
