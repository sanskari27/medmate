#!/bin/bash
# Wait until the platform instance is online and bootstrap finished.
set -euo pipefail

INSTANCE_ID="${1:?instance id}"
REGION="${2:?region}"
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

for _ in $(seq 1 40); do
  STATUS="$(aws ssm describe-instance-information \
    --region "$REGION" \
    --filters "Key=InstanceIds,Values=${INSTANCE_ID}" \
    --query "InstanceInformationList[0].PingStatus" \
    --output text 2>/dev/null || true)"
  if [[ "$STATUS" == "Online" ]]; then
    if bash "$SCRIPT_DIR/ssm-run.sh" "$INSTANCE_ID" "$REGION" 90 <<'EOF'
test -x /opt/medmate/bin/ensure-database
test -x /opt/medmate/bin/deploy-app
command -v psql >/dev/null
docker inspect -f '{{.State.Running}}' caddy | grep -qx true
EOF
    then
      echo "instance ${INSTANCE_ID} is ready"
      exit 0
    fi
  fi
  sleep 15
done

echo "instance ${INSTANCE_ID} did not become ready" >&2
bash "$SCRIPT_DIR/ssm-run.sh" "$INSTANCE_ID" "$REGION" 60 <<'EOF' || true
tail -n 120 /var/log/medmate-bootstrap.log 2>/dev/null || true
tail -n 80 /var/log/cloud-init-output.log 2>/dev/null || true
EOF
exit 1
