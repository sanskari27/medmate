# medmate-server

Hostname: `https://api.nammamedmate.com`

What it does: Java 21 Spring Boot API for the pharmacy CRM. The current build exposes actuator health and info only. CRM modules are added from requirement specs.

Where its records are stored: local development uses Postgres database `medmate_server` on the host. Production Postgres is not enabled yet.

Where its files are stored: none. Uploads are not enabled.

How it is deployed: Docker on the shared EC2 instance, 768 MB, port 8080. Local development does not use that image. It runs Java 21 and Postgres 16 on the host (`make api`). The platform health check is `/actuator/health`. Infrastructure for the repository and DNS record is `packages/infra/medmate-server`.

The [cutover](cutover.md) from `server-core` is finished. The old stack is destroyed, and applying `packages/infra/medmate-server` creates `api.nammamedmate.com` for this service.
