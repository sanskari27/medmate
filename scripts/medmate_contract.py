"""Load and validate packages/apps/*/project.yaml."""

from __future__ import annotations

import json
import re
from pathlib import Path

import yaml

ZONES = {"nammamedmate.com", "medmatepharmacy.com"}
KINDS = {"react", "next", "node", "java"}
PACKAGE_MANAGERS = {"npm", "pnpm", "yarn"}
JAVA_VERSION = "21"
# Gate name to the npm script package.json must define.
NODE_SCRIPTS = {
    "typecheck": "typecheck",
    "lint": "lint",
    "format": "format:check",
    "test": "test",
}
NAME_RE = re.compile(r"^[a-z][a-z0-9-]{0,39}$")
HOST_RE = re.compile(
    r"^[a-z0-9]([a-z0-9-]{0,61}[a-z0-9])?(\.[a-z0-9]([a-z0-9-]{0,61}[a-z0-9])?)+$"
)
DB_RE = re.compile(r"^[a-z][a-z0-9_]{0,30}$")
PREFIX_RE = re.compile(r"^[a-z0-9][a-z0-9/_-]{0,80}$")
MEMORY_RE = re.compile(r"^[0-9]+(\.[0-9]+)?[mMgG]$")
CPU_RE = re.compile(r"^[0-9]+(\.[0-9]+)?$")
ENV_RE = re.compile(r"^[A-Za-z_][A-Za-z0-9_]*$")
RELATIVE_RE = re.compile(r"^[A-Za-z0-9._/-]+$")
FORBIDDEN_NAMES = {"cdk.json", "pulumi.yaml", "serverless.yml", "serverless.yaml"}
SKIP_DIRS = {"node_modules", "dist", "target", ".git"}


def quality_commands(kind: str) -> dict[str, str]:
    """Shell commands for the quality gates a kind is allowed to request."""
    if kind == "java":
        return {
            "compile": "mvn -B -DskipTests compile",
            "test": "mvn -B test",
            "verify": "mvn -B verify",
        }
    if kind in {"react", "next", "node"}:
        return {
            "typecheck": "npm run typecheck",
            "lint": "npm run lint",
            "format": "npm run format:check",
            "test": "npm test",
        }
    return {}


def repo_root() -> Path:
    return Path(__file__).resolve().parents[1]


def app_dirs(root: Path | None = None) -> list[Path]:
    apps = (root or repo_root()) / "packages" / "apps"
    if not apps.is_dir():
        return []
    return sorted(path for path in apps.iterdir() if path.is_dir() and not path.name.startswith("."))


def _mapping(value, label: str, errors: list[str]) -> dict:
    if value is None:
        return {}
    if not isinstance(value, dict):
        errors.append(f"{label} must be a mapping")
        return {}
    return value


def _string_map(value, label: str, errors: list[str]) -> dict[str, str]:
    mapping = _mapping(value, label, errors)
    cleaned: dict[str, str] = {}
    for key, item in mapping.items():
        if not isinstance(key, str) or not ENV_RE.match(key):
            errors.append(f"{label} key {key!r} is not an environment name")
            continue
        if not isinstance(item, str) or "\n" in item or "\r" in item:
            errors.append(f"{label}.{key} must be a single-line string")
            continue
        cleaned[key] = item
    return cleaned


def _relative(value: str, label: str, errors: list[str]) -> str:
    if not isinstance(value, str) or not RELATIVE_RE.match(value) or ".." in value.split("/"):
        errors.append(f"{label} must stay inside the application directory")
        return "."
    return value


def normalize(raw: dict, directory_name: str) -> dict:
    errors: list[str] = []
    name = raw.get("name")
    kind = raw.get("kind")
    if name != directory_name or not isinstance(name, str) or not NAME_RE.match(str(name)):
        errors.append(f"{directory_name}: name must match the directory and {NAME_RE.pattern}")
    if kind not in KINDS:
        errors.append(f"{directory_name}: kind must be react, next, node, or java")

    routing = _mapping(raw.get("routing"), f"{directory_name}.routing", errors)
    records_raw = routing.get("records")
    records = []
    if not isinstance(records_raw, list) or not records_raw:
        errors.append(f"{directory_name}: routing.records must list at least one zone")
    else:
        for index, record in enumerate(records_raw):
            record = _mapping(record, f"{directory_name}.routing.records[{index}]", errors)
            zone = record.get("zone")
            hosts = record.get("hosts")
            if zone not in ZONES:
                errors.append(f"{directory_name}: zone must be one of {', '.join(sorted(ZONES))}")
                continue
            if not isinstance(hosts, list) or not hosts:
                errors.append(f"{directory_name}: {zone} needs at least one host")
                continue
            clean_hosts = []
            for host in hosts:
                if not isinstance(host, str):
                    errors.append(f"{directory_name}: host names must be strings")
                    continue
                lowered = host.lower().rstrip(".")
                if not HOST_RE.match(lowered) or not (lowered == zone or lowered.endswith("." + zone)):
                    errors.append(f"{directory_name}: {lowered} is outside {zone}")
                    continue
                clean_hosts.append(lowered)
            records.append({"zone": zone, "hosts": clean_hosts})

    build = _mapping(raw.get("build"), f"{directory_name}.build", errors)
    package_manager = build.get("packageManager", "npm")
    if package_manager not in PACKAGE_MANAGERS:
        errors.append(f"{directory_name}: packageManager must be npm, pnpm, or yarn")
        package_manager = "npm"
    install_defaults = {
        "npm": "npm ci",
        "pnpm": "pnpm install --frozen-lockfile",
        "yarn": "yarn install --frozen-lockfile",
    }
    command_defaults = {
        "npm": "npm run build",
        "pnpm": "pnpm run build",
        "yarn": "yarn build",
    }
    install = build.get("install", install_defaults[package_manager])
    command = build.get("command", command_defaults[package_manager])
    for label, value in (("install", install), ("command", command)):
        if not isinstance(value, str) or not value.strip() or "\n" in value:
            errors.append(f"{directory_name}: build.{label} must be a single-line command")
    node_version = str(build.get("nodeVersion", "22"))
    if not re.fullmatch(r"\d+(\.\d+)*", node_version):
        errors.append(f"{directory_name}: build.nodeVersion must be a version number")

    resources = _mapping(raw.get("resources"), f"{directory_name}.resources", errors)
    database = _mapping(resources.get("database"), f"{directory_name}.resources.database", errors)
    uploads = _mapping(resources.get("uploads"), f"{directory_name}.resources.uploads", errors)
    database_enabled = bool(database.get("enabled", False))
    uploads_enabled = bool(uploads.get("enabled", False))
    database_name = database.get("name") or (name.replace("-", "_") if isinstance(name, str) else "")
    if database_enabled and (not isinstance(database_name, str) or not DB_RE.match(database_name)):
        errors.append(f"{directory_name}: database name must match {DB_RE.pattern}")
    extra_prefix = uploads.get("prefix", "") or ""
    if not isinstance(extra_prefix, str) or ".." in extra_prefix or extra_prefix.startswith("/"):
        errors.append(f"{directory_name}: uploads.prefix must stay under the application prefix")
        extra_prefix = ""
    extra_prefix = extra_prefix.strip("/")
    if extra_prefix and not PREFIX_RE.match(extra_prefix):
        errors.append(f"{directory_name}: uploads.prefix contains unsupported characters")
    if isinstance(name, str):
        uploads_prefix = "/".join(part for part in ("app-uploads", name, extra_prefix) if part)
        if not uploads_prefix.startswith(f"app-uploads/{name}"):
            errors.append(f"{directory_name}: uploads prefix escapes app-uploads/{name}")
    else:
        uploads_prefix = ""

    if kind == "react" and (database_enabled or uploads_enabled):
        errors.append(f"{directory_name}: a React site cannot request a database or uploads")

    runtime = _mapping(raw.get("runtime"), f"{directory_name}.runtime", errors)
    default_port = 3000 if kind in {"next", "node"} else 8080
    port = runtime.get("port", default_port)
    if kind in {"next", "node", "java"}:
        if isinstance(port, bool) or not isinstance(port, int) or not 1 <= port <= 65535:
            errors.append(f"{directory_name}: runtime.port must be an integer from 1 to 65535")
    health_path = runtime.get("healthPath", "/")
    if not isinstance(health_path, str) or not health_path.startswith("/"):
        errors.append(f"{directory_name}: runtime.healthPath must start with /")
    memory = str(runtime.get("memory", "512m"))
    cpus = str(runtime.get("cpus", "0.5"))
    if kind in {"next", "node", "java"}:
        if not MEMORY_RE.match(memory):
            errors.append(f"{directory_name}: runtime.memory must look like 512m")
        if not CPU_RE.match(cpus):
            errors.append(f"{directory_name}: runtime.cpus must be a number")
    command_override = runtime.get("command", [])
    if command_override is None:
        command_override = []
    if not isinstance(command_override, list) or not all(isinstance(item, str) for item in command_override):
        errors.append(f"{directory_name}: runtime.command must be a list of strings")
        command_override = []

    quality = _quality(raw.get("quality"), kind if isinstance(kind, str) else "", directory_name, errors)

    project = {
        "name": name if isinstance(name, str) else directory_name,
        "kind": kind if isinstance(kind, str) else "",
        "routing": {"records": records},
        "build": {
            "workingDirectory": _relative(str(build.get("workingDirectory", ".")), f"{directory_name}.build.workingDirectory", errors),
            "packageManager": package_manager,
            "nodeVersion": node_version,
            "install": install if isinstance(install, str) else "",
            "command": command if isinstance(command, str) else "",
            "output": _relative(str(build.get("output", "dist")), f"{directory_name}.build.output", errors),
            "env": _string_map(build.get("env"), f"{directory_name}.build.env", errors),
            "dockerfile": _relative(str(build.get("dockerfile", "Dockerfile")), f"{directory_name}.build.dockerfile", errors),
            "context": _relative(str(build.get("context", ".")), f"{directory_name}.build.context", errors),
            "target": str(build.get("target", "") or ""),
        },
        "runtime": {
            "port": port if isinstance(port, int) else default_port,
            "healthPath": health_path if isinstance(health_path, str) else "/",
            "memory": memory,
            "cpus": cpus,
            "command": command_override,
            "env": _string_map(runtime.get("env"), f"{directory_name}.runtime.env", errors),
        },
        "resources": {
            "database": {"enabled": database_enabled, "name": database_name if isinstance(database_name, str) else ""},
            "uploads": {"enabled": uploads_enabled, "prefix": extra_prefix, "uploadsPrefix": uploads_prefix},
        },
        "quality": quality,
        "errors": errors,
    }
    return project


def _quality(value, kind: str, directory_name: str, errors: list[str]) -> list[str]:
    if value is None:
        return []
    if not isinstance(value, dict):
        errors.append(f"{directory_name}: quality must be a mapping of gate names")
        return []
    commands = quality_commands(kind)
    enabled: list[str] = []
    for key, flag in value.items():
        if key not in commands:
            allowed = ", ".join(commands) or "none"
            errors.append(f"{directory_name}: quality.{key} is not a {kind} gate ({allowed})")
            continue
        if flag is not True:
            errors.append(f"{directory_name}: quality.{key} must be true")
            continue
        enabled.append(key)
    return [gate for gate in commands if gate in enabled]


def _forbidden_infra(app_dir: Path) -> list[str]:
    found = []
    for path in app_dir.rglob("*"):
        if any(part in SKIP_DIRS for part in path.parts):
            continue
        if not path.is_file():
            continue
        if path.name in FORBIDDEN_NAMES or path.suffix in {".tf"} or path.name.endswith(".tf.json"):
            found.append(str(path.relative_to(repo_root())))
    return found


def load_projects(root: Path | None = None) -> list[dict]:
    projects = []
    for app_dir in app_dirs(root):
        manifest = app_dir / "project.yaml"
        project_errors = []
        if not manifest.is_file():
            projects.append({"name": app_dir.name, "errors": [f"{app_dir.name}: project.yaml is missing"], "routing": {"records": []}})
            continue
        try:
            raw = yaml.safe_load(manifest.read_text()) or {}
        except yaml.YAMLError as exc:
            projects.append({"name": app_dir.name, "errors": [f"{app_dir.name}: invalid YAML ({exc})"], "routing": {"records": []}})
            continue
        if not isinstance(raw, dict):
            projects.append({"name": app_dir.name, "errors": [f"{app_dir.name}: project.yaml must be a mapping"], "routing": {"records": []}})
            continue
        project = normalize(raw, app_dir.name)
        project["path"] = app_dir
        for forbidden in _forbidden_infra(app_dir):
            project_errors.append(f"{forbidden}: application directories cannot contain infrastructure code")
        if project["kind"] in {"next", "node", "java"}:
            dockerfile = (app_dir / project["build"]["dockerfile"]).resolve()
            context = (app_dir / project["build"]["context"]).resolve()
            if not dockerfile.is_file() or context not in dockerfile.parents and dockerfile.parent != context:
                project_errors.append(f"{app_dir.name}: Dockerfile must exist inside the build context")
        if project["kind"] == "react" and not (app_dir / "package.json").is_file():
            project_errors.append(f"{app_dir.name}: package.json is required")
        project_errors.extend(_quality_tools(project, app_dir))
        project["errors"].extend(project_errors)
        projects.append(project)
    return projects


def validate_projects(projects: list[dict] | None = None) -> list[str]:
    projects = load_projects() if projects is None else projects
    errors: list[str] = []
    seen: dict[str, str] = {}
    for project in projects:
        errors.extend(project.get("errors", []))
        for record in project.get("routing", {}).get("records", []):
            for host in record.get("hosts", []):
                owner = seen.get(host)
                if owner:
                    errors.append(f"{host} is requested by both {owner} and {project['name']}")
                else:
                    seen[host] = project["name"]
    return errors


def _quality_tools(project: dict, app_dir: Path) -> list[str]:
    gates = project.get("quality") or []
    if not gates:
        return []
    kind = project.get("kind")
    if kind in {"react", "next", "node"}:
        package_path = app_dir / "package.json"
        try:
            package = json.loads(package_path.read_text())
        except (OSError, json.JSONDecodeError):
            return [f"{app_dir.name}: quality gates require a readable package.json"]
        scripts = package.get("scripts") if isinstance(package, dict) else None
        if not isinstance(scripts, dict):
            return [f"{app_dir.name}: package.json scripts must be a mapping"]
        missing = [NODE_SCRIPTS[gate] for gate in gates if NODE_SCRIPTS[gate] not in scripts]
        if missing:
            joined = ", ".join(missing)
            return [f"{app_dir.name}: quality gates require npm scripts: {joined}"]
        return []
    if kind == "java" and not (app_dir / "pom.xml").is_file():
        return [f"{app_dir.name}: quality gates require pom.xml"]
    return []


def hosts_of(project: dict) -> list[str]:
    hosts = []
    for record in project["routing"]["records"]:
        hosts.extend(record["hosts"])
    return hosts
