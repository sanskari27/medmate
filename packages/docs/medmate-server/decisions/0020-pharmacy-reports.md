# 0020. Pharmacy reports

Status: accepted

## Context

An approved pharmacy opens the 23 reports listed on the dispensary hub. The figures come from bills, sale returns, purchases, purchase returns, stock, offers, expenses, credit repayments, and distributor payments that are already stored. Identity already owns `reports:read` and `reports:export`. Flyway has used V1 through V20. No new table is required.

## Decision

- Reports live in a new sibling module, `medmate-server-reports`. There is no new deployable and no new Flyway version.
- The module depends on identity for `Access.pharmacy` and on shared JDBC. It does not depend on the billing, stock, CRM, expense, or distributor modules. It reads their posted tables and never writes them.
- A change to those tables has to keep this read working. Server-core is not a source for the queries.
- The routes are `GET /pharmacy/reports/{id}` and `GET /pharmacy/reports/{id}/export`. Read uses `reports:read`. Export uses `reports:export`. There is no second permission catalog.

## Consequences

- The next migration in any module is V21 or later.
- The dispensary dev server already proxies `/pharmacy`, which covers these routes.
- Server-core report code is not a source for this module.
