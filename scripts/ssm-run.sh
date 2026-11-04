#!/bin/bash
# Run a shell script on the platform instance and wait for it to finish.
# Usage: ssm-run.sh <instance-id> <region> <timeout-seconds> <<'EOF'
# commands
# EOF
set -euo pipefail

INSTANCE_ID="${1:?instance id}"
REGION="${2:?region}"
TIMEOUT="${3:?timeout seconds}"
COMMAND="$(cat)"

PARAMS_FILE="$(mktemp)"
trap 'rm -f "$PARAMS_FILE"' EXIT
python3 -c 'import json, sys
json.dump({"commands": [sys.stdin.read()]}, sys.stdout)' <<<"$COMMAND" > "$PARAMS_FILE"

COMMAND_ID="$(aws ssm send-command \
  --region "$REGION" \
  --instance-ids "$INSTANCE_ID" \
  --document-name AWS-RunShellScript \
  --comment "medmate" \
  --parameters "file://${PARAMS_FILE}" \
  --query Command.CommandId \
  --output text)"

DEADLINE=$((SECONDS + TIMEOUT))
while (( SECONDS < DEADLINE )); do
  sleep 5
  RESULT="$(aws ssm get-command-invocation \
    --region "$REGION" \
    --command-id "$COMMAND_ID" \
    --instance-id "$INSTANCE_ID" \
    --output json 2>/dev/null || true)"
  if [[ -z "$RESULT" ]]; then
    continue
  fi
  STATUS="$(python3 -c 'import json, sys; print(json.loads(sys.argv[1]).get("Status", "Pending"))' "$RESULT")"
  case "$STATUS" in
    Success)
      python3 -c 'import json, sys; print(json.loads(sys.argv[1]).get("StandardOutputContent", ""), end="")' "$RESULT"
      exit 0
      ;;
    Failed|Cancelled|TimedOut)
      python3 -c 'import json, sys
data = json.loads(sys.argv[1])
sys.stderr.write(data.get("StandardOutputContent", ""))
sys.stderr.write(data.get("StandardErrorContent", ""))' "$RESULT" >&2
      exit 1
      ;;
  esac
done

echo "timed out waiting for SSM command ${COMMAND_ID}" >&2
exit 1
