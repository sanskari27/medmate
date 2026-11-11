# 0004. Production Postgres and Flyway

Status: accepted

## Context

Identity and pharmacy verification need stored accounts. [0002](0002-local-java-and-postgres.md) kept the production container without a database so tests and the image could start before any CRM data existed. `project.yaml` left `resources.database.enabled` false for the same reason.

## Decision

- `resources.database.enabled` is true. The database name stays `medmate_server`.
- Flyway migrates the schema from `medmate-server-identity` on the `local`, `prod`, and `identity-it` profiles.
- The default profile still excludes datasource auto-configuration. `ActuatorHealthIT` boots without Postgres.
- Identity flow tests start Postgres 16 with Testcontainers when Docker is available. Otherwise they use database `medmate_server_it` on the host Postgres. They do not use the host database that `make api` uses.
- This ADR replaces the 0002 consequence that the production container stays without a database. Local Java and the Docker deployment from 0002 stay as they are.

## Consequences

- Production deploy creates the database through the existing app-service Terraform path and injects `SPRING_DATASOURCE_*` from Secrets Manager.
- `make api-verify` needs Docker for the identity flow test. It does not need the host Postgres role.
- A deployment without database credentials will fail Flyway on the `prod` profile.
