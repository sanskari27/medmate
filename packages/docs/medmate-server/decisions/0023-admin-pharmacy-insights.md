# 0023. Admin pharmacy insights

Status: accepted

## Context

Platform admin and platform staff can read a pharmacy application and its block state. The same database already holds sales, stock, purchases, credit, expenses, staff, CRM, and support rows. The pharmacy dashboard and the 23 reports already turn those posted rows into money figures. Admin needs the same figures across pharmacies, without a new table and without patient or employee records.

## Decision

- Oversight lives in a new sibling module, `medmate-server-oversight`. There is no new deployable and no new Flyway version.
- The module depends on identity for the directory-reader check, on `medmate-server-dashboard` for `DashboardRules`, and on `medmate-server-reports` for `ReportStore` and `ReportRules`. It does not depend on the billing, stock, CRM, expense, employee, or support modules. It reads their posted tables through JDBC and never writes them.
- `GET /pharmacy-insights` is the fleet. `GET /pharmacy-insights/{id}` is one pharmacy, with `range` of `7d`, `30d`, or `12m`. An omitted range is `30d`.
- The reader is a platform admin or platform staff member who can already open the pharmacy directory. A pharmacy account is refused.

## Consequences

- A change to the posted tables has to keep this read, the dashboard read, and the reports read working.
- The admin dev server proxies `/pharmacy-insights`.
