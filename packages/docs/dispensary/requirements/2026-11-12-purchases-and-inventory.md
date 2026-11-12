# Purchases and inventory

## Context

An approved pharmacy records distributor bills and sees the stock those bills create. The purchases screen lists bills and returns, and the inventory screen opens a medicine, its batches, and the receipt for that medicine. The pharmacy app stays untouched and is not imported. The API is [Pharmacy purchases and inventory](../../medmate-server/requirements/2026-11-12-pharmacy-purchases-and-inventory.md).

## Scope

- Catalogue items Purchases and Inventory, after Distributors, for an approved owner and for pharmacy staff who hold the matching Read key.
- `/purchases`, `/purchases/:id`, and `/inventory`.
- A new purchase, a CSV fill, a return from a receipt, inventory filters and search, a reorder level, a CSV export, and a purchase-history path into the receipt.
- The Manage Users dialog gains the Purchases and Inventory modules.
- A negative distributor outstanding is shown as a credit on the existing distributors screen.

## Non-goals

- Purchase orders, a supply list, price compare, rack locations, Rx-only, unallocated, alerts, dead stock, loose sale, and online selling.
- Input GST credit and Total GRNs.
- Editing or deleting a saved bill or return.
- The admin portal and the pharmacy app.

## Behavior

The nav order under Catalogue is Distributors, Purchases, Inventory. The first visible Catalogue item carries the heading. An approved owner always sees both new items. A staff member sees Purchases only with `purchases:read`, and Inventory only with `inventory:read`. Create, Return, Update, or Export alone leave the item hidden, and the route sends that person to the dashboard.

Purchases loads `GET /pharmacy/purchases` through the portal API client. The shell title is Purchases and the subtitle is `Distributor bills and returns`. Three cards follow, in order: Purchases this month (amount, hint is the bill count), Total outstanding payable (green when the sum is negative), and Returns this month (amount, hint is the return count). The heading Goods inward / purchase bills sits above the table, with a split button on the right. The main action is New purchase entry. The arrow opens Upload CSV and Download sample. The table columns are Type, Reference, Distributor, Invoice no., Date, Items, Taxable, GST, and Total. Amounts on a return stay positive. The type label is Purchase or Return. A row opens `/purchases/:id`.

The entry dialog asks for distributor, invoice number, and invoice date, then the lines. The distributor list is the active distributors with `showInPurchases`. A line is a medicine typeahead, batch, expiry, billed qty, free qty, rate, MRP, and GST percent. The typeahead calls `GET /pharmacy/medicines/search` after two characters and shows name, pack, and marketer. Choosing a row sets the id and name, and puts the catalog MRP in the MRP field as a starting value. GST is not filled. Save stays disabled until the header and one complete line are present. `purchases:create` shows the split button. A failed save shows the problem detail on the dialog.

Upload CSV parses `product_id`, `batch_no`, `expiry`, `qty`, `free`, `rate`, `mrp`, and `gst`. A row that fails those checks, or whose id is missing or ambiguous from `POST /pharmacy/medicines/validate`, is listed with its line number and is not added. Valid rows fill the same dialog. Download sample saves that header and one example row. The distributor, invoice number, and date stay on the form.

The receipt shows the distributor, invoice number, invoice date, and entered time, then the line table and the bill total. `purchases:return` shows Create return when a line still has units that can be returned. The return form asks for billed and free units on each line. Save stays disabled when every quantity is zero or any quantity is above the remaining or the on-hand cap. The saved return returns to the list.

Inventory loads `GET /pharmacy/inventory`. The shell title is Inventory and the subtitle is `Stock, batches and expiry`. Five cards follow: Total SKUs (units as the hint), Stock value at cost, Retail value at MRP, Low and out of stock (the value is low plus out, the hint is the out-of-stock count), and Expiring within 4 months (the hint is the cost at risk). The Low card sets the Low stock filter. The Expiring card sets the Expiring filter. The controls under the cards are the filters All, Low stock, Out of stock, and Expiring, then the search field `Search by name, composition, manufacturer…`, then Export, then Purchase. Search matches name, composition, and marketer on the loaded list and combines with the selected filter. Low stock is quantity above zero and at or below the reorder level. Out of stock is zero. Expiring includes a past batch and runs through the current month plus four. Export downloads a CSV of the current rows and is shown only with `inventory:export`. Purchase is shown only with `purchases:read` and `purchases:create`, and opens a new purchase entry.

The table columns are Product, Type, Batches, Expiry, Stock, MRP, and Value. Expiry and MRP come from the nearest batch that still has quantity. A row opens a dialog with Details and Batches. Details shows the snapshot, quantity, cost value, MRP value, nearest expiry, and the reorder level. `inventory:update` shows the reorder field and saves `PATCH /pharmacy/inventory/{productId}`. Batches lists batch, expiry, quantity, rate, and MRP for batches with quantity above zero. Purchase history lists that medicine's purchase and return lines from `GET /pharmacy/purchases?productId=`. Choosing one opens `/purchases/:id`.

The permission dialog lists Purchases, then Inventory, after Distributors. Purchases has Read, Create, and Return. Inventory has Read, Update, and Export. The access count is `n / 23`.

On the distributors screen, a negative outstanding uses the pharmacy green on the Total outstanding card, the table, and the statement Outstanding figure. A positive outstanding stays red. A zero outstanding stays neutral. The payment form stays hidden from use when outstanding is not above zero.

## Acceptance criteria

- An owner sees Catalogue, then Distributors, Purchases, and Inventory. A staff member with `purchases:read` sees Purchases. A staff member with only `purchases:create` who opens `/purchases` lands on the dashboard. The same rule applies to Inventory and `inventory:read`.
- The purchase page shows the three cards and the split button. A CSV row with a GST percent outside 0, 5, 12, and 18 is listed and is not added to the form. Create return is absent without `purchases:return`.
- The inventory page shows the five cards and the four filters. The reorder field is absent without `inventory:update`. Export is absent without `inventory:export`. The Batches tab lists a batch that still has quantity.
- The Manage Users dialog includes Purchases Return and Inventory Export. The access count uses 23.

## Tests

- `catalog.test.ts` for Catalogue modules Distributors, Purchases, and Inventory, and the twenty-three keys.
- `UsersPage.test.tsx` for `n / 23` and the new permission rows.
- `PurchasesPage.test.tsx` for the three cards, the split button, a rejected CSV row left out of the form, and Create return hidden without `purchases:return`.
- `InventoryPage.test.tsx` for the five cards, the four filters, reorder hidden without update, export hidden without export, and the batches tab.
- `AppRouter.test.tsx` for Catalogue order, a staff member with `purchases:read`, a staff member without it sent to the dashboard, and the same pair for inventory.
