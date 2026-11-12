# 0015. Pharmacy racks

Status: accepted

## Context

An approved pharmacy records where each inventory product sits on the shelves. The product and its batches already live in the stock module. Identity already owns the permission catalog. Flyway has used V1 through V12.

## Decision

- Rack placement stays in `medmate-server-stock`. There is no new module. Identity does not depend on stock.
- `inventory_product` gains nullable `rack` and `rack_alt`. A new `rack` table stores codes that may have no product yet. Both live in the same Postgres database. Flyway keeps one history. The script is `V13__racks.sql`. The next migration in either module is V14 or later.
- The location is on the product, not the batch. A purchase still does not change it.
- Permission keys are added to `PharmacyPermissions`. The stock module checks them with `Access.pharmacy`. There is no second catalog.
- `racks:export` gates the dispensary audit file. This server does not add an export route.

## Consequences

- A later migration must not reuse V13.
- The dispensary dev server already proxies `/pharmacy`, which covers these routes.
- Server-core rack code is not a source for this module.
