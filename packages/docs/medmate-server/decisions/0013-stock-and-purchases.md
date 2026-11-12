# 0013. Stock and purchases

Status: accepted

## Context

An approved pharmacy records distributor bills, returns stock from those bills, and keeps one inventory row per medicine with a batch for each batch number. Outstanding stays on the distributor ledger from [0012](0012-distributor-directory.md). Medicine identity comes from medicine-data. Identity already owns the permission catalog. Flyway has used V1 through V9.

## Decision

- `medmate-server-stock` is a sibling module. It depends on shared, identity, and distributors. The app module depends on it. Identity does not depend on it. Distributors does not depend on it.
- Purchase, return, and inventory tables live in the same Postgres database. Flyway keeps one history for the process. The script is `V10__stock.sql`. The next migration in either module is V11 or later.
- JDBC beans, the stock service, and the medicine-data HTTP client load on the `local`, `prod`, and `identity-it` profiles. The identity-it profile uses an in-process catalog fake. The default profile does not open them.
- The base URL is `medmate.medicine-data.base-url`. The portal does not call medicine-data.
- Permission keys are added to `PharmacyPermissions`. The stock module checks them with `Access.pharmacy`. There is no second catalog.
- A purchase or return posts a ledger line through the distributor store when the rounded amount is at least 1. The stock module does not store a second outstanding figure. A return may take outstanding below zero. A payment still cannot.

## Consequences

- A later migration must not reuse V10.
- The dispensary dev server already proxies `/pharmacy`, which covers these routes.
- Server-core purchase and stock code is not a source for this module.
