# 0018. Pharmacy CRM

Status: accepted

## Context

Staff need one patient directory, credit bills, khata repayments, and CRM writes. Billing already owns the sale tables and the stock decrement. Identity already owns the permission catalog. Flyway has used V1 through V18.

## Decision

- CRM writes live in a new sibling module, `medmate-server-crm`. There is no new deployable. Identity does not depend on it. Billing does not depend on it.
- The module depends on identity for `Access.pharmacy` and on billing for posted bills and stored return refunds. Billing exposes `PatientBills`. CRM does not write `bill` or `sale_return`.
- A patient is not a stored row. The phone on an included bill is the key. Profile, repayments, reminders, redemptions, campaigns, and feedback are stored.
- `V19__crm.sql` adds those tables and widens `bill_pay` so `pay_mode` may be `cash` or `credit`. The next migration in any module is V20 or later.
- Permission keys `patients:read` and `patients:update` are added to `PharmacyPermissions`. Posting a credit bill stays `billing:create`. There is no second catalog.
- Outstanding is computed again on the server from credit-bill payables, return refunds, and repayments. A client outstanding is ignored.

## Consequences

- A later migration must not reuse V19.
- The dispensary dev server already proxies `/pharmacy`, which covers these routes.
- Server-core customer and CRM code is not a source for this module.
