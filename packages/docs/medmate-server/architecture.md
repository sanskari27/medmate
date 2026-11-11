# Architecture

medmate-server is a modular monolith. One Spring Boot process serves `api.nammamedmate.com`. New CRM areas are added as sibling Maven modules under `packages/apps/medmate-server`, and the runnable module keeps wiring them in. A separate service needs an ADR.

## Layout

```text
packages/apps/medmate-server/          Maven reactor
  medmate-server-shared/               request ids and ProblemDetail
  medmate-server-identity/             accounts, sessions, pharmacy verification
  medmate-server-app/                  runnable Spring Boot jar
    com.medmate.server                 application and component scan
    com.medmate.server.config          process concerns (request id, local datasource)
```

A feature module depends on `medmate-server-shared`. It may depend on identity for access checks. It does not depend on another feature module unless an ADR says the dependency is part of the domain. Identity does not depend on a feature module.

## Request path

Caddy routes `api.nammamedmate.com` to the container port 8080. `RequestIdFilter` keeps a safe `X-Request-Id`, stores it on the request, and puts it in the log context. Unexpected failures become `ProblemDetail` JSON. Framework errors that already carry an HTTP status, including unknown paths, are left alone.

## Health

Actuator exposes `health` and `info` on the application port. Liveness is `/actuator/health/liveness`. Readiness is `/actuator/health/readiness`. Details, env, heap dumps, and beans are not exposed. The platform checks `/actuator/health`.

`/actuator/info` includes the Maven build coordinates. Production sets `SPRING_PROFILES_ACTIVE=prod` and writes ECS JSON logs.

## Local development and deployment

Local development runs Java 21 on the host and talks to a Postgres 16 installed on the host. `make api` selects the `local` profile, which opens `jdbc:postgresql://127.0.0.1:5432/medmate_server` as the `pharmacy` role and runs Flyway. `make sms-mock` records OTP deliveries on port 8090. The default profile does not open a database, so the health test starts without one. The `prod` profile opens the production database and runs Flyway.

Deployment is a Docker image on the shared EC2 instance, the same shape server-core used. Building that image is not part of the local run loop. Production documents go to the private prefix `app-uploads/medmate-server`.

## Not in this process

The old `server_core` database, `app-uploads/server-core/` prefix, and `/medmate-repo/server-core/` parameters are leftovers from the previous service. This process does not read them.
