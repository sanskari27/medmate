#!/usr/bin/env python3
"""Deploy one application from its project.yaml using the same steps as GitHub Actions."""

from __future__ import annotations

import os
import subprocess
import sys
import time
from pathlib import Path

from medmate_contract import hosts_of, load_projects, repo_root, validate_projects

REGION = "ap-south-1"
BUCKET = "medmate-repo"


def run(command: list[str] | str, cwd: Path | None = None, env: dict | None = None, shell: bool = False) -> None:
    printable = command if isinstance(command, str) else " ".join(command)
    print(f"+ {printable}", flush=True)
    subprocess.run(command, cwd=cwd, env=env, shell=shell, check=True)


def aws(*args: str) -> str:
    result = subprocess.run(
        ["aws", *args, "--region", REGION],
        check=True,
        text=True,
        capture_output=True,
    )
    return result.stdout.strip()


def parameter(name: str) -> str:
    return aws("ssm", "get-parameter", "--name", name, "--query", "Parameter.Value", "--output", "text")


def deploy_react(project: dict) -> None:
    app_dir = Path(project["path"])
    build = project["build"]
    work = (app_dir / build["workingDirectory"]).resolve()
    env = os.environ.copy()
    env.update(build["env"])
    env["AWS_DEFAULT_REGION"] = REGION
    run(build["install"], cwd=work, env=env, shell=True)
    run(build["command"], cwd=work, env=env, shell=True)
    dist = work / build["output"]
    if not (dist / "index.html").is_file():
        raise SystemExit(f"{project['name']}: {build['output']}/index.html was not produced")
    destination = f"s3://{BUCKET}/static-sites/{project['name']}/"
    run([
        "aws", "s3", "sync", str(dist), destination,
        "--delete", "--region", REGION,
    ])
    run([
        "aws", "s3", "cp", str(dist / "index.html"), destination + "index.html",
        "--cache-control", "no-cache",
        "--content-type", "text/html",
        "--region", REGION,
    ])
    manifest = dist / "manifest.webmanifest"
    if manifest.is_file():
        run([
            "aws", "s3", "cp", str(manifest), destination + "manifest.webmanifest",
            "--content-type", "application/manifest+json",
            "--region", REGION,
        ])
    distribution_id = parameter(f"/medmate-repo/{project['name']}/distribution_id")
    run([
        "aws", "cloudfront", "create-invalidation",
        "--distribution-id", distribution_id,
        "--paths", "/*",
        "--region", REGION,
    ])
    print(f"published {project['name']} to {destination}")


def deploy_container(project: dict) -> None:
    app_dir = Path(project["path"])
    build = project["build"]
    runtime = project["runtime"]
    repository = parameter(f"/medmate-repo/{project['name']}/ecr_repository")
    tag = os.environ.get("GITHUB_SHA", "").strip()[:12] or time.strftime("local-%Y%m%d%H%M%S")
    image = f"{repository}:{tag}"
    context = (app_dir / build["context"]).resolve()
    dockerfile = (app_dir / build["dockerfile"]).resolve()
    command = [
        "docker", "build", "--platform", "linux/amd64",
        "-f", str(dockerfile), "-t", image,
    ]
    if build["target"]:
        command.extend(["--target", build["target"]])
    command.append(str(context))
    run(command)
    registry = repository.split("/")[0]
    password = aws("ecr", "get-login-password")
    subprocess.run(
        ["docker", "login", "--username", "AWS", "--password-stdin", registry],
        input=password,
        text=True,
        check=True,
    )
    run(["docker", "push", image])
    instance_id = parameter("/medmate-repo/common/ec2_instance_id")
    hosts = ",".join(hosts_of(project))
    remote = "\n".join([
        "set -euo pipefail",
        f"aws s3 cp s3://{BUCKET}/platform-scripts/deploy-app.sh /opt/medmate/bin/deploy-app --region {REGION}",
        "chmod 755 /opt/medmate/bin/deploy-app",
        " ".join([
            "/opt/medmate/bin/deploy-app",
            project["name"],
            image,
            str(runtime["port"]),
            hosts,
            runtime["healthPath"],
            runtime["memory"],
            runtime["cpus"],
        ]),
    ])
    script = repo_root() / "scripts" / "ssm-run.sh"
    print(f"+ ssm deploy {project['name']}", flush=True)
    subprocess.run(
        ["bash", str(script), instance_id, REGION, "600"],
        input=remote,
        text=True,
        check=True,
    )
    print(f"deployed {image}")


def main() -> int:
    if len(sys.argv) != 2:
        print("usage: deploy_app.py <app-name>", file=sys.stderr)
        return 2
    errors = validate_projects()
    if errors:
        for error in errors:
            print(error, file=sys.stderr)
        return 1
    name = sys.argv[1]
    matches = [project for project in load_projects() if project["name"] == name]
    if not matches:
        print(f"unknown application {name}", file=sys.stderr)
        return 1
    project = matches[0]
    if project["kind"] == "react":
        deploy_react(project)
    else:
        deploy_container(project)
    return 0


if __name__ == "__main__":
    try:
        raise SystemExit(main())
    except subprocess.CalledProcessError as exc:
        if exc.stderr:
            print(exc.stderr, file=sys.stderr)
        raise SystemExit(exc.returncode)
