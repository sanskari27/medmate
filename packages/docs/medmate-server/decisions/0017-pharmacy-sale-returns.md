# 0017. Pharmacy sale returns

Status: accepted

## Context

An approved pharmacy can post a cash bill. Staff now need the list of those bills and a partial return that puts units back on the sold batch. Billing already owns the sale tables, the invoice counter, and the stock decrement. Identity already owns the permission catalog. Flyway has used V1 through V16.

## Decision

- Sale returns stay in `medmate-server-billing`. There is no new Maven module. Identity does not depend on billing. Stock does not depend on billing.
- `V17__sale_returns.sql` adds `sale_return`, `sale_return_line`, and `returned_qty` on `bill_line`. The next migration in any module is V18 or later.
- Stock exposes `CounterStock.increment`. Billing calls that port in the same transaction as the return insert. It does not write `inventory_batch` itself.
- Permission keys `sales:read` and `sales:return` are added to `PharmacyPermissions`. The billing module checks them with `Access.pharmacy`. There is no second catalog.
- The refund is computed again on the server from the stored unit price and the bill extra. A client amount is ignored.

## Consequences

- A later migration must not reuse V17.
- The dispensary dev server already proxies `/pharmacy`, which covers these routes.
- Server-core sale code is not a source for the return.
