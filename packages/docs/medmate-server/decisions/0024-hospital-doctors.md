# 0024. Hospital doctors

Status: accepted

## Context

A hospital pharmacy keeps a doctor directory that is separate from employees and from login accounts. Photos and registration documents have to stay in the private upload bucket. Identity already owns accounts, the permission catalog, the pharmacy type, and the document store. Flyway has used V1 through V21.

## Decision

- `medmate-server-doctors` is a sibling module. It depends on shared and identity. The app module depends on it. Identity does not depend on it.
- Doctor tables live in the same Postgres database. Flyway keeps one history for the process. The script is `V22__doctors.sql`. The next migration in either module is V23 or later.
- JDBC beans and the doctor service load on the `local`, `prod`, and `identity-it` profiles, the same gate identity uses. The default profile does not open them, so the health test still starts without a database.
- Photos and documents use the identity `DocumentStore`. The prefix stays `app-uploads/medmate-server`. Doctor objects live under `doctor-documents/{pharmacyId}/{doctorId}/`. Production uses S3 when `APP_UPLOADS_BUCKET` is set. Local and tests use the in-memory store.
- Permission keys `doctors:read`, `doctors:create`, and `doctors:update` are added to `PharmacyPermissions`. The doctors module checks them with `Access.pharmacy`, and also refuses the call unless the pharmacy row's type is `hospital`. There is no second catalog.
- The signed-in account includes `pharmacyType` from the pharmacy row already loaded for the session, so the dispensary can hide the Hospital section without reading the owner-only profile.

## Consequences

- A later migration must not reuse V22.
- The dispensary dev server already proxies `/pharmacy`, which covers these routes.
- Server-core doctor code is not a source for this module.
