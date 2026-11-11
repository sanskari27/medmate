# Cutover from server-core

This repository change does not destroy AWS resources and does not reload Caddy. A push to `main` applies `packages/infra/medmate-server` and can deploy the new container. Do that only after the old host is released.

`server-core` and `medmate-server` cannot both own `api.nammamedmate.com`. Terraform will fail to create the second Route 53 record. Deploy will fail Caddy validation if `/opt/medmate/sites/server-core.caddy` still names that host.

## Order

1. From a checkout that still contains `packages/infra/server-core`, destroy that stack. This removes the DNS record, ECR repository `medmate/server-core`, and SSM parameters under `/medmate-repo/server-core/`.

   ```bash
   terraform -chdir=packages/infra/server-core init -backend-config=backend.hcl
   terraform -chdir=packages/infra/server-core destroy
   ```

2. On the EC2 host, stop the old container and delete its site file, then reload Caddy:

   ```bash
   docker rm -f server-core
   rm -f /opt/medmate/sites/server-core.caddy
   # regenerate /opt/medmate/Caddyfile from the remaining site files, then:
   docker exec caddy caddy validate --config /etc/caddy/Caddyfile
   docker exec caddy caddy reload --config /etc/caddy/Caddyfile
   ```

3. Merge the medmate-server branch to `main`. Infra apply creates state `medmate-server/terraform.tfstate` and the `api.nammamedmate.com` record. Deploy starts the container and curls `/actuator/health`.

## Left behind

`terraform destroy` does not drop the Postgres database `server_core` and does not delete objects under `s3://medmate-repo/app-uploads/server-core/`. medmate-server does not use either. Dropping them is a separate decision.
