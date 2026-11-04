#!/usr/bin/env python3
"""Print a JSON list of applications that a GitHub push should deploy."""

import json
import os
import subprocess

from medmate_contract import app_dirs, repo_root


def changed_names() -> list[str]:
    names = [path.name for path in app_dirs()]
    before = os.environ.get("BEFORE", "")
    if not before or set(before) <= {"0"}:
        return names
    try:
        output = subprocess.check_output(
            ["git", "diff", "--name-only", before, "HEAD"],
            cwd=repo_root(),
            text=True,
        )
    except subprocess.CalledProcessError:
        return names
    files = [line.strip() for line in output.splitlines() if line.strip()]
    if any(path.startswith("packages/infra/scripts/") or path.startswith("scripts/") for path in files):
        return names
    selected = []
    for name in names:
        prefix = f"packages/apps/{name}/"
        if any(path.startswith(prefix) for path in files):
            selected.append(name)
    return selected


def main() -> None:
    print(json.dumps(changed_names()))


if __name__ == "__main__":
    main()
