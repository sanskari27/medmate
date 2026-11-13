# List pagination

## Context

Sales, purchases, inventory, support cases, pharmacy owners, and pharmacy applications each return every row in one response. Distributor payments are embedded on every distributor, and the offer list embeds the product catalog. Those sets grow with use. The dispensary screen is [List pagination](../../dispensary/requirements/2026-11-13-list-pagination.md). The admin screen is [List pagination](../../admin/requirements/2026-11-13-list-pagination.md). This does not read the old server-core service.

## Scope

- Numbered pages on `GET /pharmacy/sales`, `GET /pharmacy/purchases`, `GET /pharmacy/inventory`, `GET /pharmacy/distributors/{code}/payments`, `GET /support/cases`, `GET /pharmacy-owners`, and `GET /pharmacy-applications`.
- A shared page parser. `page` defaults to 1. `size` defaults to 25 and must be 1 through 100.
- Whole-set summary fields on sales, purchases, and inventory.
- `GET /pharmacy/inventory` also accepts `billing:read` or `offers:read`.
- Indexes for a paged order that is not already indexed.

## Non-goals

- A new permission key, a new Maven module, or a new error JSON shape.
- Paging medicine search, offers, employees, staff, FAQs, rack codes, the distributor directory, or `GET /pharmacy/racks`.
- Reading `server_core`, `app-uploads/server-core/`, or `/medmate-repo/server-core/*`.

## Behavior

A missing `page` is 1. A missing `size` is 25. A blank, non-integer, or non-positive `page` or `size`, or a `size` above 100, is 400 with detail `Page is not valid`. A page past the end returns an empty item list, the requested `page` and `size`, and the real `total`.

Each paged response keeps its item key and adds `page`, `size`, and `total`. Queries count the matching set, then apply `LIMIT` and `OFFSET` in the order below. Summary cards use a separate aggregate and ignore `page`, `size`, and text or row filters.

`GET /pharmacy/sales` stays behind `sales:read`. Rows stay newest `recordedAt` first, then id. `q` is a case-insensitive substring of the id, invoice number, patient name, or the words `sale` and `return`. A blank `q` returns every row. `stats` stays the current Asia/Kolkata month over the whole ledger, including rows that `q` excludes.

`GET /pharmacy/purchases` stays behind `purchases:read`. `productId` still limits the documents. Rows stay newest `recordedAt` first, then id. `stats` stays the whole pharmacy ledger, including documents outside `productId` and outside the page.

`GET /pharmacy/inventory` is allowed for `inventory:read`, `billing:read`, or `offers:read`. The detail when none of those keys is held is `Inventory cannot be read`. Rows are ordered by an exact product-id match for `q` first, then `name`, then `product_id`. `q` matches name, composition, marketer, and product id, ignoring case. `filter` is `all` when omitted. `low` is units above 0 and a cost that rounds to under 1000. `out` is zero units. `expiring` is a batch with qty above 0 whose expiry month is the current Asia/Kolkata month, an earlier month, or at most four months ahead. Any other `filter` is 400 with detail `Filter is not valid`. `summary` ignores `q`, `filter`, and the page. It is `skuCount`, `unitCount`, `cost`, `retail`, `lowCount`, `outCount`, `expiringCount`, and `expiringCost`. Amounts are decimal strings.

`GET /pharmacy/distributors/{code}/payments` requires `distributors:read`. The detail is `Distributors cannot be read`. An unknown code is 404 with detail `Distributor was not found`. Payments are oldest `recordedAt` first, then code. The item key is `payments`. `GET /pharmacy/distributors` no longer includes `transactions`. Outstanding stays on the distributor.

`GET /pharmacy/offers` no longer includes `products`. Create and update still reject an unknown product id.

`GET /support/cases` keeps today's pharmacy-or-platform scope. Rows are newest `createdAt` first, then id. The item key is `cases`.

`GET /pharmacy-owners` keeps today's access. Blank names sort last, then lower-case name, then id. The item key is `owners`.

`GET /pharmacy-applications` keeps today's compliance access. An omitted or blank `status` returns `pending_compliance` and `pending_admin` together. One of those two statuses still returns only that status. Any other status is 400 with detail `Status is required`. Rows are oldest `submittedAt` first, null `submittedAt` last, then id. The item key is `applications`.

`GET /pharmacy/racks` still returns every product.

## Acceptance criteria

- Page 1 of a 30-row ledger returns 25 rows and `total` 30. Page 2 returns the remaining 5. Page 3 returns no rows and the same `total`.
- A sales or purchase `stats` value counts rows that are not on the current page. An inventory `summary` counts products excluded by `q` and `filter`.
- `size=101`, `page=0`, and `filter=nope` are 400. A distributor payment list for another pharmacy's code is 404.
- Omitting `status` on applications returns both waiting statuses in submission order. The distributor list has no `transactions`. The offer list has no `products`.

## Tests

- `PageQueryTest` for the defaults and the 400 cases.
- An inventory filter unit test for low, out, and expiring.
- `SaleControllerTest`, `StockControllerTest`, `DistributorControllerTest`, `OfferControllerTest`, `SupportControllerTest`, and the identity web tests for a bad `size` and the page envelope.
- `SaleIT`, `PurchaseIT`, `DistributorIT`, `SupportFlowIT`, and `IdentityFlowIT` for the next slice, whole-set totals, both waiting statuses, and a distributor list without transactions.
- Bruno `sales/list-sales.bru`, `purchases/list-purchases.bru`, `inventory/list-inventory.bru`, `support/list-cases.bru`, `identity/owners/list-owners.bru`, `identity/review/list-applications.bru`, and `distributors/list-payments.bru`. `offers/list-offers.bru` and `distributors/list-distributors.bru` stop expecting the dropped fields.
