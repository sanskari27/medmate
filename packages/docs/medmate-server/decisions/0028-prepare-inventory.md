# 0028. Prepare inventory

Status: accepted

## Context

Platform admin and sales staff need a private worksheet for opening stock. Those rows are not pharmacy stock and they are not catalog products. Flyway on `medmate_server` has used V1 through V26. The catalog already resolves a product id from `medicine_data`.

## Decision

- Lists live in a new sibling module, `medmate-server-prep`. There is no new deployable. Identity does not depend on it. The module depends on identity for `AccountPrincipal` and on catalog for `CatalogStore.findMany` at export only. It does not depend on stock, billing, or server-core.
- `V27__prepare_inventory.sql` stores `prep_list` and `prep_line` on the primary database. The next migration in any module is V28 or later. Catalog Flyway is unchanged.
- Routes under `/api/v1/inventory-prep` are allowed for a non-disabled platform admin and for staff whose subtypes include `sales`, through `Access.platform(..., "sales")`. No key is added to `PharmacyPermissions`.
- The security filter permits `/api/v1/inventory-prep` and `/api/v1/inventory-prep/**` so a missing session reaches the module. The pharmacy approval gate allows the same paths through. A rejected bearer stays on the existing JWT filter.
- Export reads the catalog. It does not write stock. A missing catalog bean or a catalog database failure is 503.
- Server-core is not a source for this module.

## Consequences

- A later migration must not reuse V27.
- The admin dev server proxies `/api` to this process, which covers these routes.
- Another account's list id is 404.
