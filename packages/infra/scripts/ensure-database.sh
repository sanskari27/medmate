#!/bin/bash
# Create an application database and role on the shared RDS instance.
# Re-running keeps the existing secret and resets the role password to match it.
set -euo pipefail

APP_NAME="${1:?app name}"
DB_NAME="${2:?database name}"
REGION="${AWS_REGION:-ap-south-1}"

if ! [[ "$APP_NAME" =~ ^[a-z][a-z0-9-]{0,39}$ ]]; then
  echo "invalid app name" >&2
  exit 1
fi
if ! [[ "$DB_NAME" =~ ^[a-z][a-z0-9_]{0,30}$ ]]; then
  echo "invalid database name" >&2
  exit 1
fi
if ! command -v psql >/dev/null 2>&1; then
  echo "psql is not installed" >&2
  exit 1
fi

APP_USER="$(printf '%s' "$APP_NAME" | tr '-' '_')_user"
SECRET_NAME="medmate/${APP_NAME}/database"
ENDPOINT="$(aws ssm get-parameter --region "$REGION" --name /medmate-repo/common/rds_endpoint --query Parameter.Value --output text)"
PORT="$(aws ssm get-parameter --region "$REGION" --name /medmate-repo/common/rds_port --query Parameter.Value --output text)"
MASTER_ARN="$(aws ssm get-parameter --region "$REGION" --name /medmate-repo/common/rds_secret_arn --query Parameter.Value --output text)"
MASTER_JSON="$(aws secretsmanager get-secret-value --region "$REGION" --secret-id "$MASTER_ARN" --query SecretString --output text)"

eval "$(python3 -c 'import json, shlex, sys
data = json.loads(sys.argv[1])
print("MUSER=" + shlex.quote(data["username"]))
print("MPASS=" + shlex.quote(data["password"]))' "$MASTER_JSON")"

CREATE_SECRET=0
if aws secretsmanager describe-secret --region "$REGION" --secret-id "$SECRET_NAME" >/dev/null 2>&1; then
  APP_JSON="$(aws secretsmanager get-secret-value --region "$REGION" --secret-id "$SECRET_NAME" --query SecretString --output text)"
  eval "$(python3 -c 'import json, shlex, sys
data = json.loads(sys.argv[1])
print("APP_PASS=" + shlex.quote(data["password"]))' "$APP_JSON")"
else
  APP_PASS="$(openssl rand -hex 16)"
  CREATE_SECRET=1
fi

export PGPASSWORD="$MPASS"
PSQL=(psql "host=${ENDPOINT} port=${PORT} user=${MUSER} dbname=postgres sslmode=require" -v ON_ERROR_STOP=1)

"${PSQL[@]}" <<SQL
DO \$\$
BEGIN
  IF NOT EXISTS (SELECT FROM pg_roles WHERE rolname = '${APP_USER}') THEN
    CREATE ROLE ${APP_USER} LOGIN PASSWORD '${APP_PASS}';
  ELSE
    ALTER ROLE ${APP_USER} WITH LOGIN PASSWORD '${APP_PASS}';
  END IF;
END
\$\$;
SQL

EXISTS="$("${PSQL[@]}" -tAc "SELECT 1 FROM pg_database WHERE datname = '${DB_NAME}'" | tr -d '[:space:]')"
if [[ "$EXISTS" != "1" ]]; then
  "${PSQL[@]}" -c "CREATE DATABASE ${DB_NAME} OWNER ${APP_USER}"
fi

psql "host=${ENDPOINT} port=${PORT} user=${MUSER} dbname=${DB_NAME} sslmode=require" -v ON_ERROR_STOP=1 \
  -c "ALTER SCHEMA public OWNER TO ${APP_USER}; GRANT ALL ON SCHEMA public TO ${APP_USER};"

if [[ "$CREATE_SECRET" == "1" ]]; then
  SECRET_JSON="$(python3 -c 'import json, sys
print(json.dumps({
  "username": sys.argv[1],
  "password": sys.argv[2],
  "host": sys.argv[3],
  "port": sys.argv[4],
  "dbname": sys.argv[5],
  "jdbcUrl": "jdbc:postgresql://%s:%s/%s?sslmode=require" % (sys.argv[3], sys.argv[4], sys.argv[5]),
}))' "$APP_USER" "$APP_PASS" "$ENDPOINT" "$PORT" "$DB_NAME")"
  aws secretsmanager create-secret \
    --region "$REGION" \
    --name "$SECRET_NAME" \
    --secret-string "$SECRET_JSON" >/dev/null
fi

aws ssm put-parameter \
  --region "$REGION" \
  --name "/medmate-repo/${APP_NAME}/database_secret_name" \
  --type String \
  --value "$SECRET_NAME" \
  --overwrite >/dev/null

echo "database ${DB_NAME} ready for ${APP_NAME}"
