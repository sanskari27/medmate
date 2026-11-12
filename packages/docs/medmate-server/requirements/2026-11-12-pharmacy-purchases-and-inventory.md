# Pharmacy purchases and inventory

## Context

An approved pharmacy records a distributor bill, which adds or tops up inventory, and can later return part of that bill. The bill and the return move the distributor ledger from [Pharmacy distributors](2026-11-12-pharmacy-distributors.md). Medicine identity is read from medicine-data. The dispensary screens are [Purchases and inventory](../../dispensary/requirements/2026-11-12-purchases-and-inventory.md). The module boundary is [0013](../decisions/0013-stock-and-purchases.md).

## Scope

- `GET /pharmacy/medicines/search` and `POST /pharmacy/medicines/validate`.
- `GET /pharmacy/purchases` and `GET /pharmacy/purchases/{id}`.
- `POST /pharmacy/purchases` and `POST /pharmacy/purchases/{id}/returns`.
- `GET /pharmacy/inventory`, `GET /pharmacy/inventory/{productId}`, and `PATCH /pharmacy/inventory/{productId}`.
- Permission keys `purchases:read`, `purchases:create`, `purchases:return`, `inventory:read`, `inventory:update`, and `inventory:export` on the closed pharmacy catalog.
- `GET /api/products?ids=` on medicine-data, still GET-only, for 1 to 200 ids, with `missing` on the response.
- A return may take distributor outstanding below zero. A payment still cannot exceed it.

## Non-goals

- Editing or deleting a purchase or a return.
- Purchase orders, a supply list, price compare, rack locations, and manual quantity edits.
- Sales, or any stock movement other than a purchase and a return.
- Storing GST or HSN on medicine-data.
- An HTTP route on the distributor module that creates a bill or a return.
- A server file for the inventory CSV. Export is built in the browser from the list the read route already returns.
- Reading `server_core`, `app-uploads/server-core/`, or `/medmate-repo/server-core/*`.

## Behavior

Every pharmacy route uses `Access.pharmacy` for the caller's pharmacy. An approved owner is allowed. A staff member needs the key named below. Anyone else receives 403. A failed permission check writes nothing.

`purchases:read` is required to list and to read one purchase or return. The detail is `Purchases cannot be read`.

`purchases:create` is required to save a bill, to search medicines, and to validate ids. The detail is `Purchases cannot be created`.

`purchases:return` is required to save a return. The detail is `Purchases cannot be returned`.

`inventory:read` is required for both inventory reads. The detail is `Inventory cannot be read`.

`inventory:update` is required to change the reorder level. The detail is `Inventory cannot be updated`.

`inventory:export` is stored in the catalog and gates the dispensary button. This server does not have an export route.

`GET /pharmacy/purchases` returns that pharmacy's purchases and returns, newest `recordedAt` first, then code. `productId`, when present, keeps only documents that contain that medicine. The response is `purchases` and `stats`. `GET /pharmacy/purchases/{id}` returns one `purchase`. An id outside this pharmacy is 404 with detail `Purchase was not found`.

`stats` uses the Asia/Kolkata calendar month of `recordedAt`. `purchasesThisMonth` and `purchaseCount` cover purchase documents. `returnsThisMonth` and `returnCount` cover return documents. The amounts are the rounded ledger amounts. `outstanding` is the sum of every distributor outstanding for the pharmacy and may be negative.

A document is `id`, `type` (`purchase` or `return`), `purchaseId` (null on a purchase), `distributorId`, `distributorName`, `invoiceNo`, `invoiceDate`, `recordedAt`, `taxable`, `gst`, `total`, `ledgerAmount`, `units`, and `lines`. Money fields other than `ledgerAmount` are decimal strings with two places. `units` is billed plus free. A line is `position`, `productId`, `name`, `batchNo`, `expiry`, `qty`, `freeQty`, `rate`, `mrp`, `gst`, `amount`, `returnedQty`, `returnedFree`, and `onHand`. On a return document, `returnedQty`, `returnedFree`, and `onHand` are 0. On a purchase, those three are the units already returned and the batch quantity still in stock.

Ids are `PUR-001` and `RET-001` per pharmacy, not reused. The number is one higher than the highest code of that prefix, padded to three digits through 999 and wider after that. A client-sent id is ignored.

A purchase body is `distributorId`, `invoiceNo`, `invoiceDate`, and `lines`. The distributor must belong to the pharmacy, be active, and have `showInPurchases`. The invoice number is trimmed, 1 to 40 characters, and unique for that distributor among purchases. The invoice date is `YYYY-MM-DD` and is not after today in Asia/Kolkata. There are 1 to 200 lines. A line is `productId`, `batchNo`, `expiry`, `qty`, `freeQty`, `rate`, `mrp`, and `gst`. Batch number is trimmed, 1 to 40 characters. Expiry is `YYYY-MM`, including a past month. `qty` and `freeQty` are whole numbers, zero or more, and at least one is greater than zero. `rate` and `mrp` are zero or more, with at most two decimal places. `gst` is 0, 5, 12, or 18.

Lines on one bill that share a product id and batch number must agree on expiry, rate, and MRP. Their quantities are combined. A product id that medicine-data does not know is `Product was not found`. A product id present in both catalogs is `Product id is ambiguous`. When medicine-data cannot be reached, the status is 503 and the detail is `Medicine catalog is unavailable`. Nothing is saved.

Line taxable is `rate × billed qty` at scale 2, half up. GST is that taxable amount times the percent, scale 2, half up. `ledgerAmount` is the sum of the line totals, rounded to the nearest rupee, with 0.50 rounding up. Free quantity is stocked and is not billed. A new product is inserted from the medicine-data snapshot: name, marketer, composition, form, pack, and type, with reorder level 20. Composition is the drug ingredient names and strengths, or the FMCG ingredient names, joined with commas. A later purchase refreshes that snapshot and does not change the reorder level. The same product and batch adds billed plus free quantity and replaces expiry, rate, and MRP. A new batch number creates a batch. A zero-quantity batch is kept.

When `ledgerAmount` is at least 1, a distributor ledger line of type `purchase` is inserted for that amount. The reference is the purchase id. The note is the invoice number. A zero ledger amount writes no ledger line and still updates stock. Create responds 201.

A return body is `lines` of `position`, `qty`, and `freeQty`. Each position must belong to that purchase. A position cannot be repeated. Returned billed and free units cannot pass what that line has not already returned. The sum of the units on the return cannot pass the quantity still on that batch. A refused return stores nothing. The detail is `Return is more than the quantity received` or `Return is more than the batch`. At least one unit is required. The ledger amount uses the original rate and GST on the returned billed quantity, rounded the same way. When that amount is at least 1, a ledger line of type `return` is inserted even if outstanding goes below zero. A zero amount writes no ledger line and still reduces stock. The return copies the original invoice number and date. Create responds 201.

`PATCH /pharmacy/inventory/{productId}` accepts `reorderLevel`, a whole number zero or more. Any other field is ignored. A missing product is 404 with detail `Product was not found`. The reorder level is not changed by a purchase.

`GET /pharmacy/medicines/search` requires `q` of 2 to 80 characters. `limit` defaults to 20 and is capped at 50. The response is `medicines` of `productId`, `name`, `marketer`, `pack`, and `mrp`.

`POST /pharmacy/medicines/validate` accepts `ids`, 1 to 200 distinct ids. The response is `products`, `missing`, and `ambiguous`. A product snapshot is `productId`, `name`, `marketer`, `composition`, `form`, `pack`, `type`, and `mrp`.

| Status | Detail |
| --- | --- |
| 400 | `Distributor is required` |
| 400 | `Invoice number is required` |
| 400 | `Invoice date is not valid` |
| 400 | `Invoice date is in the future` |
| 400 | `Invoice number is already used` |
| 400 | `Add at least one line` |
| 400 | `A purchase can have at most 200 lines` |
| 400 | `Product is required` |
| 400 | `Batch number is required` |
| 400 | `Expiry is not valid` |
| 400 | `Quantity must be a whole number` |
| 400 | `Add at least one unit` |
| 400 | `Rate is not valid` |
| 400 | `MRP is not valid` |
| 400 | `GST percent is not recognised` |
| 400 | `Batch details do not match` |
| 400 | `Product was not found` |
| 400 | `Product id is ambiguous` |
| 400 | `Distributor cannot be used for purchases` |
| 400 | `Return at least one unit` |
| 400 | `Return line was not found` |
| 400 | `Return line is repeated` |
| 400 | `Return is more than the quantity received` |
| 400 | `Return is more than the batch` |
| 400 | `Reorder level must be zero or more` |
| 400 | `q must be 2 to 80 characters` |
| 400 | `limit must be a whole number` |
| 400 | `Send 1 to 200 product ids` |
| 400 | `Bill total is too large` |
| 403 | `Purchases cannot be read` |
| 403 | `Purchases cannot be created` |
| 403 | `Purchases cannot be returned` |
| 403 | `Inventory cannot be read` |
| 403 | `Inventory cannot be updated` |
| 404 | `Purchase was not found` |
| 404 | `Distributor was not found` |
| 404 | `Product was not found` |
| 503 | `Medicine catalog is unavailable` |

## Acceptance criteria

- The first purchase in a pharmacy is `PUR-001`. It increases that distributor's outstanding by the rounded bill and creates or tops up a batch.
- A second purchase with the same distributor and invoice number is refused and changes nothing.
- An unknown product id is refused and changes nothing.
- A return can take outstanding below zero, reduces the batch, and is `RET-001`. A return above the batch or the remaining quantity stores nothing.
- Another pharmacy cannot read the purchase or the inventory row.
- A staff member with `purchases:read` can list purchases and cannot create one. A staff member with `inventory:read` can list inventory and cannot change the reorder level.

## Tests

- `PurchaseRulesTest` for the rupee rounding, free quantity, a combined batch, a mismatched batch, and a return that is capped by the remaining quantity and the batch.
- `InventoryRulesTest` for low stock, out of stock, the four-month expiry window, and cost.
- `DistributorRulesTest` for a return that passes the current outstanding, and a payment that still cannot.
- `StockControllerTest` for the permission gates.
- `PurchaseIT` for a bill that posts stock and a ledger line, a return that makes outstanding negative, a duplicate invoice, an unknown id, and pharmacy isolation.
- medicine-data `http.test.ts` for `GET /api/products?ids=`.
- Bruno: `purchases/list-purchases.bru`, `purchases/create-purchase.bru`, `purchases/read-purchase.bru`, `purchases/return-purchase.bru`, `purchases/search-medicines.bru`, `purchases/validate-medicines.bru`, `inventory/list-inventory.bru`, and `inventory/update-reorder.bru`.

The module is [0013](../decisions/0013-stock-and-purchases.md).
