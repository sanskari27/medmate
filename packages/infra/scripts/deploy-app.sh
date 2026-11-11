#!/bin/bash
# Pull one application image and restart only that container.
# Application containers get no mounted volumes. User files stay in S3.
set -euo pipefail

APP="${1:?app}"
IMAGE="${2:?image}"
PORT="${3:?port}"
HOSTS="${4:?hosts}"
HEALTH="${5:?health path}"
MEMORY="${6:?memory}"
CPUS="${7:?cpus}"
REGION="${AWS_REGION:-ap-south-1}"

if ! [[ "$APP" =~ ^[a-z][a-z0-9-]{0,39}$ ]]; then
  echo "invalid app name" >&2
  exit 1
fi
if ! [[ "$IMAGE" =~ \.dkr\.ecr\.${REGION}\.amazonaws\.com/medmate/[a-z0-9._/-]+:[A-Za-z0-9._-]+$ ]]; then
  echo "image must be an ECR medmate repository in ${REGION}" >&2
  exit 1
fi
if ! [[ "$PORT" =~ ^[0-9]+$ ]]; then
  echo "invalid port" >&2
  exit 1
fi
if ! [[ "$HEALTH" =~ ^/[A-Za-z0-9._/-]*$ ]]; then
  echo "invalid health path" >&2
  exit 1
fi
if ! [[ "$MEMORY" =~ ^[0-9]+(\.[0-9]+)?[mMgG]$ ]]; then
  echo "invalid memory" >&2
  exit 1
fi
if ! [[ "$CPUS" =~ ^[0-9]+(\.[0-9]+)?$ ]]; then
  echo "invalid cpus" >&2
  exit 1
fi

IFS=',' read -r -a HOST_ARRAY <<< "$HOSTS"
if [[ "${#HOST_ARRAY[@]}" -eq 0 ]]; then
  echo "at least one host is required" >&2
  exit 1
fi
for host in "${HOST_ARRAY[@]}"; do
  if ! [[ "$host" =~ ^[a-z0-9]([a-z0-9-]{0,61}[a-z0-9])?(\.[a-z0-9]([a-z0-9-]{0,61}[a-z0-9])?)+$ ]]; then
    echo "invalid host ${host}" >&2
    exit 1
  fi
done

REGISTRY="${IMAGE%%/*}"
aws ecr get-login-password --region "$REGION" | docker login --username AWS --password-stdin "$REGISTRY" >/dev/null
docker pull "$IMAGE"
docker rm -f "$APP" >/dev/null 2>&1 || true

mkdir -p /opt/medmate/env /opt/medmate/sites
ENV_FILE="/opt/medmate/env/${APP}.env"
umask 077
: > "$ENV_FILE"

BUCKET="$(aws ssm get-parameter --region "$REGION" --name /medmate-repo/common/bucket --query Parameter.Value --output text)"
UPLOADS="$(aws ssm get-parameter --region "$REGION" --name "/medmate-repo/${APP}/uploads_prefix" --query Parameter.Value --output text 2>/dev/null || true)"
if [[ -n "${UPLOADS:-}" && "$UPLOADS" != "None" ]]; then
  printf 'APP_UPLOADS_BUCKET=%s\nAPP_UPLOADS_PREFIX=%s\nAWS_REGION=%s\n' "$BUCKET" "$UPLOADS" "$REGION" >> "$ENV_FILE"
fi

DB_SECRET="$(aws ssm get-parameter --region "$REGION" --name "/medmate-repo/${APP}/database_secret_name" --query Parameter.Value --output text 2>/dev/null || true)"
if [[ -n "${DB_SECRET:-}" && "$DB_SECRET" != "None" ]]; then
  JSON="$(aws secretsmanager get-secret-value --region "$REGION" --secret-id "$DB_SECRET" --query SecretString --output text)"
  python3 -c 'import json, sys
data = json.loads(sys.argv[1])
print("SPRING_DATASOURCE_URL=" + data["jdbcUrl"])
print("SPRING_DATASOURCE_USERNAME=" + data["username"])
print("SPRING_DATASOURCE_PASSWORD=" + data["password"])
print("PGHOST=" + data["host"])
print("PGPORT=" + str(data["port"]))
print("PGDATABASE=" + data["dbname"])
print("PGUSER=" + data["username"])
print("PGPASSWORD=" + data["password"])
print("PGSSLMODE=require")' "$JSON" >> "$ENV_FILE"
fi

RUNTIME="$(aws ssm get-parameter --region "$REGION" --name "/medmate-repo/${APP}/runtime_env" --query Parameter.Value --output text 2>/dev/null || echo '{}')"
python3 -c 'import json, sys
raw = sys.argv[1].strip() or "{}"
data = json.loads(raw)
for key, value in data.items():
    if not key.replace("_", "").isalnum() or key[0].isdigit():
        raise SystemExit("invalid environment name: " + key)
    text = str(value)
    if "\n" in text or "\r" in text:
        raise SystemExit("environment values cannot contain newlines")
    print(f"{key}={text}")' "$RUNTIME" >> "$ENV_FILE"

append_parameter() {
  local name="$1"
  local env_name="$2"
  local value
  value="$(aws ssm get-parameter --with-decryption --region "$REGION" --name "/medmate-repo/${APP}/${name}" --query Parameter.Value --output text 2>/dev/null || true)"
  if [[ -n "${value:-}" && "$value" != "None" ]]; then
    if [[ "$value" == *$'\n'* || "$value" == *$'\r'* ]]; then
      echo "parameter ${name} contains a newline" >&2
      exit 1
    fi
    printf '%s=%s\n' "$env_name" "$value" >> "$ENV_FILE"
  fi
}
append_parameter resend_api_key RESEND_API_KEY
append_parameter jwt_secret MEDMATE_JWT_SECRET
append_parameter admin_bootstrap_token MEDMATE_ADMIN_BOOTSTRAP_TOKEN
append_parameter sms_base_url MEDMATE_SMS_BASE_URL
chmod 600 "$ENV_FILE"

docker network create medmate >/dev/null 2>&1 || true
docker run -d \
  --name "$APP" \
  --network medmate \
  --restart unless-stopped \
  --memory "$MEMORY" \
  --cpus "$CPUS" \
  --env-file "$ENV_FILE" \
  "$IMAGE" >/dev/null

JOINED="$(IFS=,; echo "${HOST_ARRAY[*]}")"
cat > "/opt/medmate/sites/${APP}.caddy" <<EOF
${JOINED} {
  reverse_proxy ${APP}:${PORT}
}
EOF

python3 - <<'PY'
from pathlib import Path
header = """{
  email ops@medmatepharmacy.com
}

:80 {
  respond "medmate platform" 200
}
"""
sites = sorted(Path("/opt/medmate/sites").glob("*.caddy"))
body = "\n".join(path.read_text() for path in sites)
Path("/opt/medmate/Caddyfile").write_text(header + "\n" + body + "\n")
PY

docker exec caddy caddy validate --config /etc/caddy/Caddyfile
docker exec caddy caddy reload --config /etc/caddy/Caddyfile >/dev/null

for _ in $(seq 1 40); do
  if docker exec "$APP" curl -fsS "http://127.0.0.1:${PORT}${HEALTH}" >/dev/null; then
    echo "${APP} healthy"
    exit 0
  fi
  sleep 3
done

echo "${APP} failed health check ${HEALTH}" >&2
docker logs "$APP" 2>&1 | tail -n 80 >&2 || true
exit 1
