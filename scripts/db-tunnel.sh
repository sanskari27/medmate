#!/bin/bash
# Forward the private RDS port to localhost and print the master login.
# That login can open every database. Usage: db-tunnel.sh [local-port]
set -euo pipefail

REGION="${AWS_REGION:-ap-south-1}"
LOCAL_PORT="${1:-8769}"

if ! [[ "$LOCAL_PORT" =~ ^[0-9]+$ ]]; then
  echo "local port must be a number" >&2
  exit 1
fi

if ! command -v session-manager-plugin >/dev/null 2>&1; then
  echo "session-manager-plugin is not installed" >&2
  echo "brew install --cask session-manager-plugin" >&2
  exit 1
fi

INSTANCE_ID="$(aws ssm get-parameter --region "$REGION" --name /medmate-repo/common/ec2_instance_id --query Parameter.Value --output text)"
HOST="$(aws ssm get-parameter --region "$REGION" --name /medmate-repo/common/rds_endpoint --query Parameter.Value --output text)"
PORT="$(aws ssm get-parameter --region "$REGION" --name /medmate-repo/common/rds_port --query Parameter.Value --output text)"
MASTER_ARN="$(aws ssm get-parameter --region "$REGION" --name /medmate-repo/common/rds_secret_arn --query Parameter.Value --output text)"
MASTER_JSON="$(aws secretsmanager get-secret-value --region "$REGION" --secret-id "$MASTER_ARN" --query SecretString --output text)"

eval "$(python3 -c 'import json, shlex, sys
data = json.loads(sys.argv[1])
print("MUSER=" + shlex.quote(data["username"]))
print("MPASS=" + shlex.quote(data["password"]))' "$MASTER_JSON")"

echo "Forwarding ${HOST}:${PORT} to localhost:${LOCAL_PORT}"
echo "DBeaver — this login can open every database. Leave this running."
echo "  Host: localhost"
echo "  Port: ${LOCAL_PORT}"
echo "  Database: postgres"
echo "  Username: ${MUSER}"
echo "  Password: ${MPASS}"
echo "  SSL mode: require"

exec aws ssm start-session \
  --region "$REGION" \
  --target "$INSTANCE_ID" \
  --document-name AWS-StartPortForwardingSessionToRemoteHost \
  --parameters "$(python3 -c 'import json, sys; print(json.dumps({"host":[sys.argv[1]],"portNumber":[sys.argv[2]],"localPortNumber":[sys.argv[3]]}))' "$HOST" "$PORT" "$LOCAL_PORT")"
