# List pagination

## Context

Sales, purchases, inventory, support tickets, and distributor payments load every row at once. Billing and the offer dialog also load the whole product catalog. The API is [List pagination](../../medmate-server/requirements/2026-11-13-list-pagination.md). The pharmacy app stays untouched and is not imported.

## Scope

- A shared page bar with previous, next, and `page N of M`.
- Paged sales, purchases, inventory, product purchase history, distributor payments, and support tickets.
- Billing and the offer dialog look up products with the paged inventory request.
- Inventory export of the rows on the current page.

## Non-goals

- The admin portal, the pharmacy app, and the rack map.
- Paging offers, employees, staff, FAQs, or the distributor directory.
- A new permission row in Manage Users.
- A date filter, a page-size picker, or an export of every matching row.

## Behavior

The page bar sits under the list it pages. Previous and next are both disabled when the list fits on one page. Previous is disabled on page 1. Next is disabled on the last page. The label is `page N of M`, where `M` is `total` divided by `size`, rounded up, and at least 1.

Sales, purchases, and inventory request `page` and `size` 25 through the portal API client. The table renders the returned rows. A search field waits 300ms, then sends `q` and returns to page 1. Changing the inventory filter returns to page 1 and sends `filter`. The sales month cards keep reading `stats`. The inventory cards read `summary`, so they stay the whole catalog. Inventory export downloads the rows of the current page. The product dialog's purchase history requests `GET /pharmacy/purchases` with `productId`, `page`, and `size` 25, and shows the same page bar.

Billing does not load the catalog on open. After the scan box has text, it requests `GET /pharmacy/inventory` with that `q`, `page` 1, and `size` 8, and shows the returned rows in order. The offer dialog replaces the product dropdown with a search of the same inventory list at `page` 1 and `size` 25. While editing, the saved product id stays visible when it is absent from the current hits.

The distributor directory still loads in one response and still filters in the browser. The transaction dialog loads `GET /pharmacy/distributors/{code}/payments`. After a payment is recorded, the dialog opens the last page. Support tickets use the page bar. FAQs stay a full list. Racks stays as it is.

## Acceptance criteria

- Sales search sends `q` after 300ms and the month cards stay the returned `stats`.
- Inventory cards stay the returned `summary` while a filter shows one page. Export contains that page.
- Billing with an empty scan box does not request inventory. A query requests `size` 8.
- The offer dialog searches inventory. A recorded distributor payment leaves the dialog on the last payments page.
- The support ticket list shows the page bar. The rack page does not.

## Tests

- `SalesPage`, `PurchasesPage`, `InventoryPage`, `BillingPage`, `OfferDialog`, `DistributorsPage`, and `SupportPage` for the pager, the query params, the summary cards, the size-8 lookup, the offer search, and the payments page after a recorded payment.
