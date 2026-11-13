# Contributing

Work lands through a written requirement, a small change, and the quality gates. Dispensary and admin call this host, so an unfinished route is a production failure, not a local stub.

## How a change starts

1. Run the `medmate-requirement` command with the requirement. Answer the follow-up questions until scope, non-goals, data, API, errors, auth, and acceptance checks are settled.
2. The command writes `requirements/YYYY-MM-DD-<slug>.md` and an implementation plan. Implementation starts after that plan is accepted.
3. A change to module boundaries, storage, authentication, or the public host also adds the next numbered file in `decisions/`.

## Quality bar

From the repository root, with Java 21 and PostgreSQL 16 installed:

- `make api` starts local Postgres, then the API on the host JVM.
- `make api-format` rewrites Java with Palantir Java Format.
- `make api-verify` checks formatting and runs unit tests plus `*IT` integration tests. The health test does not need Postgres. The identity flow test starts Postgres with Testcontainers when Docker is running, and otherwise uses database `medmate_server_it` on the local Postgres 16.
- `make api-package` builds the runnable jar. The Docker image is the deployment artifact, not the local run loop.

Unit tests construct plain types with JUnit and AssertJ. `@WebMvcTest` covers one web slice. A class named `*IT` boots the application. Do not mark a slice test as an integration test to skip the boot.

Every new HTTP route gets a Bruno request under `bruno/medmate/<module>/`, using the example values in `environments/`. Assertions lock the status and the fields the route guarantees.

## Boundaries

- Keep Terraform in `packages/infra/medmate-server`. The application directory cannot contain it.
- Do not add a starter, a database, or a new service inside a feature change that did not ask for it.
- Do not copy behavior forward from the deleted `server-core` tree. Specify it again in a requirement.
- Keep controllers free of domain rules. A rule that can be tested without Spring belongs in a plain type.
