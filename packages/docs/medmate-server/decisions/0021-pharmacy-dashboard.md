# 0021. Pharmacy dashboard

Status: accepted

## Context

An approved pharmacy opens Dashboard for a snapshot of bills, returns, purchases, stock, expenses, and credit repayments that are already stored. Reports already read those tables, and they require `reports:read`. Dashboard is open to every approved owner and staff member, including staff with an empty permission set. Flyway has used V1 through V20. No new table is required.

## Decision

- Dashboard lives in a new sibling module, `medmate-server-dashboard`. There is no new deployable and no new Flyway version.
- The module depends on identity for the membership check and on `medmate-server-reports` for `ReportStore` and `ReportBooks`. It does not depend on the billing, stock, CRM, expense, or distributor modules. It reads their posted tables through the reports store and never writes them.
- `Access.pharmacy` stays key-based. Dashboard uses a separate membership check: approved, not disabled, pharmacy owner or staff, own pharmacy. No key is added to `PharmacyPermissions`.
- The route is `GET /pharmacy/dashboard`. Server-core is not a source for the queries.

## Consequences

- The next migration in any module is V21 or later.
- A change to the posted tables has to keep both this read and the reports read working.
- The dispensary dev server already proxies `/pharmacy`, which covers this route.
