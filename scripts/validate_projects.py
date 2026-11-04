#!/usr/bin/env python3
"""Fail when an application contract or an app-owned infrastructure file is invalid."""

from medmate_contract import validate_projects


def main() -> int:
    errors = validate_projects()
    if errors:
        for error in errors:
            print(error)
        return 1
    print("project contracts are valid")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
