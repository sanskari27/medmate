# 0014. Pharmacy offers

Status: accepted

## Context

An approved pharmacy stores discounts that a later billing module will apply per medicine. Inventory already lives in the stock module. Identity already owns the permission catalog. Flyway has used V1 through V10.

## Decision

- `medmate-server-offers` is a sibling module. It depends on shared, identity, and stock. The app module depends on it. Identity does not depend on it. Stock does not depend on it.
- Offer tables live in the same Postgres database. Flyway keeps one history for the process. The script is `V11__offers.sql`. `V12__drop_offer_online.sql` removes the customer-app column. The next migration in either module is V13 or later.
- JDBC beans and the offer service load on the `local`, `prod`, and `identity-it` profiles, the same gate identity uses. The default profile does not open them, so the health test still starts without a database.
- Stock exposes `InventoryNames`: the id and name of each inventory medicine for one pharmacy, and whether an id is present. Offers calls that port. It does not read `inventory_product` itself.
- Permission keys are added to `PharmacyPermissions`. The offers module checks them with `Access.pharmacy`. There is no second catalog.
- Offer numbers are allocated from a per-pharmacy counter. Deleting an offer does not return the number. The stored discount is not applied to a price in this module.

## Consequences

- A later migration must not reuse V11 or V12.
- The dispensary dev server already proxies `/pharmacy`, which covers these routes.
- Server-core promotion code is not a source for this module.
