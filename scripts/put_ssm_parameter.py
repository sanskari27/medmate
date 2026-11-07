#!/usr/bin/env python3
"""Write one SSM parameter at /medmate-repo/<scope>/<name>."""

from __future__ import annotations

import os
import re
import subprocess
import sys
from pathlib import Path

from medmate_contract import NAME_RE, load_projects, repo_root

REGION = "ap-south-1"
NAME_SEGMENT = re.compile(r"^[A-Za-z0-9_.-]+$")
TYPES = {"String", "SecureString"}


def allowed_scopes(root: Path | None = None) -> list[str]:
    """Return common plus every app whose contract name matches and whose infra stack exists."""
    root = root or repo_root()
    names: list[str] = []
    for project in load_projects(root):
        name = project.get("name")
        app_dir = project.get("path")
        if not isinstance(name, str) or not isinstance(app_dir, Path):
            continue
        if name != app_dir.name or not NAME_RE.match(name):
            continue
        if not (root / "packages" / "infra" / name).is_dir():
            continue
        names.append(name)
    return ["common", *sorted(names)]


def _mask(value: str) -> None:
    for line in value.splitlines():
        if line:
            print(f"::add-mask::{line}", flush=True)


def _fail(message: str) -> None:
    print(message, file=sys.stderr)
    raise SystemExit(1)


def main() -> int:
    scope = os.environ.get("SCOPE", "")
    name = os.environ.get("NAME", "")
    param_type = os.environ.get("TYPE", "")
    value = os.environ.get("VALUE", "")
    if value:
        _mask(value)

    scopes = allowed_scopes()
    if scope not in scopes:
        _fail(f"scope {scope!r} is not allowed. Allowed scopes: {', '.join(scopes)}")
    if not NAME_SEGMENT.fullmatch(name):
        _fail("name must be one path segment: letters, numbers, dots, underscores, or hyphens")
    if param_type not in TYPES:
        _fail("type must be String or SecureString")
    if value == "":
        _fail("value is required")

    path = f"/medmate-repo/{scope}/{name}"
    subprocess.run(
        [
            "aws",
            "ssm",
            "put-parameter",
            "--region",
            REGION,
            "--name",
            path,
            "--type",
            param_type,
            "--value",
            value,
            "--overwrite",
        ],
        check=True,
    )
    print(f"Stored {param_type} parameter {path}", flush=True)
    summary = os.environ.get("GITHUB_STEP_SUMMARY")
    if summary:
        with open(summary, "a", encoding="utf-8") as handle:
            handle.write(f"Stored `{path}` ({param_type}).\n\n")
            handle.write(
                "A later Infra apply overwrites this value if Terraform already manages that name.\n"
            )
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
