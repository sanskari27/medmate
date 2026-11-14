# Prepare Inventory

## Context

Platform admin and sales staff build a private opening-stock list, save it, and come back. A finished list downloads as a CSV to hand to the pharmacy. The API is [Prepare inventory](../../medmate-server/requirements/2026-11-15-prepare-inventory.md).

## Scope

- A Prepare Inventory nav item for a platform admin and for staff whose subtypes include `sales`.
- `/inventory-prep` for that person's lists.
- `/inventory-prep/:listId` for search, the grid, save, and CSV export.

## Non-goals

- The dispensary portal.
- A pharmacy permission key or a Manage Users row.
- Manage Catalog, Reviews, Pharmacies, Support, and Leads.
- Choosing a pharmacy, or importing the CSV.

## Behavior

`canPrepareInventory` is true for `accountType` `admin` and for staff whose subtypes include `sales`. That check shows the nav item and opens both routes. Other staff who open either path go to `/dashboard`. The nav label is Prepare Inventory, the section is Catalog, and the sub line is Opening stock. It uses the receipt icon and sits after Manage Catalog.

`/inventory-prep` loads `GET /api/v1/inventory-prep` through the portal API client. The heading is Your lists. A name field and Create sit above a paper table of name, rows, and updated time. Create sends `POST /api/v1/inventory-prep` and opens the new list. An empty response says `No lists yet.` A row opens `/inventory-prep/:listId`. Rename sends `PATCH` with the new name. Delete asks with the existing confirm dialog, then sends `DELETE`. A failed call shows the problem detail.

`/inventory-prep/:listId` loads `GET /api/v1/inventory-prep/{id}`. The toolbar stays visible: Back, the list name, Save, and Export CSV. The name is an editable field. Back, a sidebar destination, and closing the tab ask when the name or a cell differs from the last save. The choices are Save, Leave, and Stay. Save persists, then leaves. Leave discards. Stay closes the dialog.

Search sits under the toolbar inside a search landmark. The field is labeled Add a product. After two characters it requests `GET /api/search` and shows drug and FMCG hits with the product name, id, marketer, and MRP. Arrow keys move the highlight. Enter or a click appends a row, clears the query, and leaves the cursor in the search field. The stored name is `productName`. MRP is copied from the hit and stays editable. GST starts blank. Product id and product name are not edited. Adding a product that already has a blank batch shows `This product and batch is already on the list` and does not add a second row.

The grid is one table in a scrollable region named Inventory lines. The header sticks. The product name is the row header and sticks on the inline start. Columns are Product, Product id, Batch, Expiry, Qty, Free, Rate, MRP, GST, and a delete control. Delete does not ask. Tab moves batch, expiry, qty, free, rate, MRP, GST, then the next row's batch. Expiry is a month field. GST is a select with a blank option and 0, 5, 12, and 18. Qty, free, rate, and MRP are text fields with a numeric keypad. Batch turns off autocorrect. An empty grid says `Search the catalog to add a product.`

Save sends `PATCH` when the name changed, then `PUT /api/v1/inventory-prep/{id}/lines` with the rows. Blank cells are null. A non-blank cell that is not well formed, or a repeated product and batch, shows the problem detail, focuses that row, and does not send the write. Export saves first when there are unsaved edits, then `POST /api/v1/inventory-prep/{id}/export`. A problem that starts with `Row N` scrolls to that row and focuses its batch field. A CSV response downloads. The file name comes from the list name. A failed load, save, or export shows the problem detail.

## Acceptance criteria

- Admin and sales see Prepare Inventory. Support opening `/inventory-prep` lands on Home.
- Create shows the new list. An empty account says `No lists yet.` Opening a row loads its name.
- Choosing a search hit appends the product, keeps the cursor in search, and Save can store a blank batch.
- Export of an unfinished row shows the problem detail. Delete row removes that row before the next save.

## Tests

- `portalAccount.test.ts` for `canPrepareInventory`.
- `AppRouter.test.tsx` for the nav item and the support redirect.
- `PrepListPage.test.tsx` for create, the empty state, and open.
- `PrepSheetPage.test.tsx` for search-add keeping focus, saving a blank batch, an export error, and deleting a row.
