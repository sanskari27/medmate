# 0012. Distributor directory

Status: accepted

## Context

An approved pharmacy keeps a directory of the firms that supply medicine. Outstanding payable starts as an opening balance, then moves when a purchase bill, a payment, or a return is posted. Identity already owns the permission catalog. Flyway has used V1 through V8.

## Decision

- `medmate-server-distributors` is a sibling module. It depends on shared and identity. The app module depends on it. Identity does not depend on it.
- Distributor tables live in the same Postgres database. Flyway keeps one history for the process. The script is `V9__distributors.sql`. The next migration in either module is V10 or later.
- JDBC beans and the distributor service load on the `local`, `prod`, and `identity-it` profiles, the same gate identity uses. The default profile does not open them, so the health test still starts without a database.
- Permission keys are added to `PharmacyPermissions`. The distributors module checks them with `Access.pharmacy`. There is no second catalog.
- Outstanding is computed from the opening balance and the ledger lines. This module records payments over HTTP. A later purchases or returns feature posts its lines into this ledger. It does not own a second balance.

## Consequences

- A later migration must not reuse V9.
- The dispensary dev server already proxies `/pharmacy`, which covers these routes.
- Server-core supplier code is not a source for this module.
