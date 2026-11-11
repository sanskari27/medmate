# 0001. Replace server-core with medmate-server

Status: accepted

## Context

`server-core` was a multi-module Spring Boot API on `api.nammamedmate.com`, with Postgres database `server_core` and an uploads prefix. The pharmacy CRM is starting over. The hostname stays, because the console and the public sites already call it. The previous Java code, schema, and Terraform stack are not the base for the new service.

## Decision

- One new Maven reactor, `packages/apps/medmate-server`, on Java 21 and Spring Boot 3.5.6.
- One runnable module, `medmate-server-app`, package `com.medmate.server`. Later CRM areas are sibling modules in this process.
- The public surface is actuator `health` and `info`, with the platform health path `/actuator/health`.
- No database and no uploads until a requirement asks for them.
- Errors use one `ProblemDetail` shape. Request ids travel in `X-Request-Id`.
- Palantir Java Format is enforced on `verify`. Unit tests run in Surefire. `*IT` tests run in Failsafe.
- The new Terraform state key is `medmate-server/terraform.tfstate`. It is a new stack, not a rename of `server-core` state.
- Production runs with the `prod` profile so logs are ECS JSON.

## Consequences

- `api.nammamedmate.com` serves health checks after cutover. Existing console calls fail until those routes are specified and built.
- The old stack must be destroyed before the new stack is applied, or Route 53 and Caddy both reject the duplicate host. See [cutover](../cutover.md).
- Destroying the old stack does not drop database `server_core` and does not delete `s3://medmate-repo/app-uploads/server-core/`.
- CI quality gates for this app are `mvn compile`, `mvn test`, and `mvn verify`.
