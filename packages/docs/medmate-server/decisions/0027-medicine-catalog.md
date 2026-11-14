# 0027. Medicine catalog

Status: accepted

## Context

Purchases need the shared drug and FMCG catalog. That catalog lives in Postgres database `medicine_data`, and only the Node medicine-data process opens it. Stock calls that process over HTTP. The portal does not. Flyway for this process has used V1 through V26 on `medmate_server`. The catalog tables already exist and were created outside that history.

## Decision

- `medmate-server-catalog` is a sibling module. It depends on shared and identity. The app module depends on it. Stock depends on it. Identity does not depend on it. The catalog does not depend on stock.
- `medicine_data` stays a second database. The primary datasource and its Flyway history stay on `medmate_server`. Catalog Flyway uses that second database and `classpath:db/catalog`. `V1__medicine_catalog.sql` repeats the existing `CREATE TABLE IF NOT EXISTS` and `CREATE INDEX IF NOT EXISTS` statements. It does not create `pg_trgm`. The next migration in the primary history is V27 or later. The next catalog migration is V2 or later.
- Catalog beans load when `medmate.catalog.url` is set, on the `local`, `prod`, and `identity-it` profiles. Existing identity-it tests leave the property unset. The default profile does not open either database.
- `GET /api/search`, `GET /api/products`, and `GET /api/products/{productId}` are anonymous. `POST` and `PUT` under `/api/v1/catalog` are allowed for a non-disabled platform admin and for staff whose subtypes include `sales`, through `Access.platform(..., "sales")`. No key is added to `PharmacyPermissions`.
- The security filter permits `/api/search`, `/api/products`, `/api/products/**`, `/api/v1/catalog`, and `/api/v1/catalog/**` so a missing session reaches the module. The pharmacy approval gate allows the same paths through. A rejected bearer stays on the existing JWT filter.
- Stock's local and prod catalog adapter reads this module. The identity-it profile keeps the in-process catalog fake. The HTTP client and `medmate.medicine-data.base-url` are removed.
- Production passes `MEDICINE_DATASOURCE_URL`, `MEDICINE_DATASOURCE_USERNAME`, and `MEDICINE_DATASOURCE_PASSWORD` when `/medmate-repo/medmate-server/catalog_database_secret_name` names the existing secret `medmate/medicine-data/database`. No new database is created.
- Server-core is not a source for this module. The Node app and its host stay until a later cutover.

## Consequences

- A later primary migration must not reuse V1 through V26. A later catalog migration must not reuse V1.
- A production deploy without the catalog secret fails to start on the `prod` profile.
- The dispensary dev server already proxies `/api` and `/pharmacy`, which covers these routes.
