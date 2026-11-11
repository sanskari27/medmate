# 0002. Local Java and Postgres, Docker for deployment

Status: accepted

## Context

medmate-server is deployed the same way server-core was: a Docker image on the shared EC2 host. Developers should not need that image to work on the API. This machine already uses a local JDK for other Java work, and the CRM will store rows in Postgres.

The production container does not get a database yet. `project.yaml` leaves `resources.database.enabled` false until a requirement asks for stored CRM data.

## Decision

- Local development runs the process with Java 21 on the host. `make api` and `make dev` refuse to start when Java 21 is missing. Install it with `brew install openjdk@21`.
- Local development uses a Postgres 16 installed on the host, not a database inside the application container. `make api` starts it, creates the `pharmacy` role, and creates the `medmate_server` database. The Spring `local` profile opens that connection.
- The default profile and the `prod` profile do not open a connection. Tests and the deployed container stay up without Postgres.
- `docker build` produces the image that production runs. It is not the local development loop.

## Consequences

- `make api` requires Java 21 and PostgreSQL 16 on the developer machine.
- Docker remains required to publish the image, and `make db-up` remains the Docker Postgres used by todo-server. medmate-server does not use that container.
- Enabling the production database is a later change to `project.yaml` and Terraform, plus an ADR.
