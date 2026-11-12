# 0011. Employee register

Status: accepted

## Context

Pharmacy owners keep a personnel register that is separate from login accounts. Photos and identity documents have to stay in the private upload bucket. Identity already owns accounts, the permission catalog, and the document store. Flyway has used V1 through V6.

## Decision

- `medmate-server-employees` is a sibling module. It depends on shared and identity. The app module depends on it. Identity does not depend on it.
- Employee tables live in the same Postgres database. Flyway keeps one history for the process. The script is `V7__employees.sql`. The next migration in either module is V8 or later.
- JDBC beans and the employee service load on the `local`, `prod`, and `identity-it` profiles, the same gate identity uses. The default profile does not open them, so the health test still starts without a database.
- Photos and documents use the identity `DocumentStore`. The prefix stays `app-uploads/medmate-server`. Employee objects live under `employee-documents/{pharmacyId}/{code}/`. Production uses S3 when `APP_UPLOADS_BUCKET` is set. Local and tests use the in-memory store.
- Permission keys are added to `PharmacyPermissions`. The employees module checks them with `Access.pharmacy`. There is no second catalog.

## Consequences

- A later migration must not reuse V7.
- The dispensary dev server already proxies `/pharmacy`, which covers these routes.
- Server-core employee code is not a source for this module.
