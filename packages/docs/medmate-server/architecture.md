# Architecture

medmate-server is a modular monolith. One Spring Boot process serves `api.nammamedmate.com`. New CRM areas are added as sibling Maven modules under `packages/apps/medmate-server`, and the runnable module keeps wiring them in. A separate service needs an ADR.

## Layout

```text
packages/apps/medmate-server/          Maven reactor
  medmate-server-app/                  runnable Spring Boot jar
    com.medmate.server                 application and component scan
    com.medmate.server.config          process concerns (request id)
    com.medmate.server.shared.web      values shared by every module
    com.medmate.server.shared.error    ProblemDetail responses
```

A feature module depends on `shared` types. It does not depend on another feature module unless an ADR says the dependency is part of the domain.

## Request path

Caddy routes `api.nammamedmate.com` to the container port 8080. `RequestIdFilter` keeps a safe `X-Request-Id`, stores it on the request, and puts it in the log context. Unexpected failures become `ProblemDetail` JSON. Framework errors that already carry an HTTP status, including unknown paths, are left alone.

## Health

Actuator exposes `health` and `info` on the application port. Liveness is `/actuator/health/liveness`. Readiness is `/actuator/health/readiness`. Details, env, heap dumps, and beans are not exposed. The platform checks `/actuator/health`.

`/actuator/info` includes the Maven build coordinates. Production sets `SPRING_PROFILES_ACTIVE=prod` and writes ECS JSON logs.

## Local development and deployment

Local development runs Java 21 on the host and talks to a Postgres 16 installed on the host. `make api` selects the `local` profile, which opens `jdbc:postgresql://127.0.0.1:5432/medmate_server` as the `pharmacy` role. The default profile and the `prod` profile do not open a database, so tests and the deployed container start without one.

Deployment is a Docker image on the shared EC2 instance, the same shape server-core used. Building that image is not part of the local run loop.

## Not in this process yet

There is no Flyway migration, object storage, or authentication. The production database stays disabled until a requirement asks for stored CRM data. The old `server_core` database and `app-uploads/server-core/` prefix are leftovers from the previous service. This process does not read them.
