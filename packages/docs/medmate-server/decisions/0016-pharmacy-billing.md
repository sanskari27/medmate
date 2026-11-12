# 0016. Pharmacy billing

Status: accepted

## Context

An approved pharmacy posts a cash sale from the counter. Offers already store discounts and do not change a price. Inventory already stores batches and does not store a prescription flag or a GST rate. Identity already owns the permission catalog and the invoice prefix. Flyway has used V1 through V13.

## Decision

- `medmate-server-billing` is a sibling module. It depends on shared, identity, stock, and offers. The app module depends on it. Identity does not depend on it. Stock does not depend on offers or billing. Offers do not depend on billing.
- Sale tables live in the same Postgres database. Flyway keeps one history. `V14__batch_gst_and_prescription.sql` in stock adds `prescription_required` and `gst`. `V15__bills.sql` in billing creates the sale and the per-pharmacy counter. The next migration in either module is V16 or later.
- JDBC beans and the bill service load on the `local`, `prod`, and `identity-it` profiles, the same gate identity uses. The default profile does not open them, so the health test still starts without a database.
- Stock exposes sellable batches and a decrement. Offers expose active offers. Identity exposes the invoice prefix. Billing calls those ports. It does not read `inventory_batch`, `offer`, or `pharmacy` itself.
- The batch quantity falls in the same transaction as the bill insert. The server recomputes the winning offer. A client price is ignored.
- Permission keys are added to `PharmacyPermissions`. The billing module checks them with `Access.pharmacy`. There is no second catalog.

## Consequences

- A later migration must not reuse V14 or V15.
- The dispensary dev server already proxies `/pharmacy`, which covers this route.
- Server-core sale code is not a source for this module.
