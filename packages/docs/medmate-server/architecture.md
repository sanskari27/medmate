# Architecture

medmate-server is a modular monolith. One Spring Boot process serves `api.nammamedmate.com`. New CRM areas are added as sibling Maven modules under `packages/apps/medmate-server`, and the runnable module keeps wiring them in. A separate service needs an ADR.

## Layout

```text
packages/apps/medmate-server/          Maven reactor
  medmate-server-shared/               request ids and ProblemDetail
  medmate-server-identity/             accounts, sessions, pharmacy verification
  medmate-server-support/              FAQs, support cases, and the live chat socket
  medmate-server-employees/            pharmacy personnel register
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

## Identity

Accounts, sessions, and pharmacy verification live in `medmate-server-identity`. A phone may hold one account of each stored type: `admin`, `pharmacy`, `customer`, `rider`, and `staff`. Admin and staff are the exception: one phone is at most one of those two. `accountType: "platform"` on OTP send and verify is a login scope, not a stored type. It resolves to that single admin or staff row. Pharmacy, customer, and rider login are unchanged.

## Support

FAQs and support cases live in `medmate-server-support`. The module depends on identity for access checks and for pharmacy and account names. Identity does not depend on it. Tables are created by `V5__support.sql` in the single Flyway history. Live chat is a raw WebSocket at `/support/stream` on this process. The handshake is open, and the first frame carries the access token. Case writes stay on HTTP. [0009](decisions/0009-support-module-and-live-chat.md) records that boundary.

## Employees

The personnel register lives in `medmate-server-employees`. The module depends on identity for access checks, the pharmacy workplace, and the document store. Identity does not depend on it. Tables are created by `V7__employees.sql`. Photos and documents use the same private prefix as pharmacy licences, under `employee-documents/`. [0011](decisions/0011-employee-register.md) records that boundary.

## Not in this process

The old `server_core` database, `app-uploads/server-core/` prefix, and `/medmate-repo/server-core/` parameters are leftovers from the previous service. This process does not read them.
