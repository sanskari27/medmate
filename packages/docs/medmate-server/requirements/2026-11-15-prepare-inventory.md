# Prepare inventory

## Context

Platform admin and sales staff prepare a private opening-stock list, leave it, and come back. When every row is complete they download a CSV and hand that file to the pharmacy. The admin screen is [Prepare Inventory](../../admin/requirements/2026-11-15-prepare-inventory.md). This does not read the old server-core service, and it does not write pharmacy stock.

## Scope

- A new module, `medmate-server-prep`, and `V27__prepare_inventory.sql` on the primary database.
- Private named lists and their rows for the signed-in account.
- CSV export of a complete list.

## Non-goals

- A pharmacy permission key, a change to `PharmacyPermissions`, or a Manage Users row.
- Linking a list to a pharmacy, or changing stock, purchases, or the dispensary.
- Importing the CSV.
- Reading `server_core`, `app-uploads/server-core/`, or `/medmate-repo/server-core/*`.
- Depending on stock or billing. Catalog is used only to resolve a product id at export.

## Behavior

A non-disabled platform admin, or a non-disabled staff account whose subtypes include `sales`, may call every route below. Anyone else, including a missing session, a pharmacy owner, and any other staff subtype, receives 403 with detail `This action is not allowed.` A bearer the existing JWT filter rejects stays 401 with detail `Session was not accepted`.

A list is visible only to the account that created it. A missing id, or an id owned by someone else, is 404 with detail `List was not found`.

`POST /api/v1/inventory-prep` body is `{ "name" }`. The name is trimmed. Blank, missing, or non-text is 400 `Name is required`. Longer than 80 characters is 400 `Name is too long`. The same owner cannot have two names that match ignoring case. That is 409 `List name already exists`. Create responds 201 `{ "list": { "id", "name", "lineCount", "updatedAt" } }` with `lineCount` 0. `updatedAt` is an ISO-8601 instant.

`GET /api/v1/inventory-prep` returns `{ "lists" }` for the caller only, newest `updatedAt` first, then id. Each item is `id`, `name`, `lineCount`, and `updatedAt`.

`GET /api/v1/inventory-prep/{id}` returns `{ "list": { "id", "name", "updatedAt", "lines" } }`. A line is `position` (1-based, in stored order), `productId`, `productName`, `batchNo`, `expiry`, `qty`, `free`, `rate`, `mrp`, and `gst`. A blank batch, expiry, qty, free, rate, MRP, or GST is null. `rate` and `mrp`, when present, are numbers with two decimal places.

`PATCH /api/v1/inventory-prep/{id}` body is `{ "name" }` with the same name rules. It responds 200 with the summary object used by create.

`PUT /api/v1/inventory-prep/{id}/lines` replaces every row. The body is `{ "lines" }`. Missing `lines`, or a `lines` value that is not an array, is 400 `Lines are not valid`. More than 2000 rows is 400 `A list can hold 2000 rows`. An empty array clears the list and is 200. Responds 200 with the same object as `GET`.

A draft row requires `productId` and `productName`. `productId` is trimmed text, 1 to 80 characters. `productName` is trimmed text, 1 to 300 characters. Otherwise the detail is `Row N: Product is required` or `Row N: Product name is required`. `N` is the 1-based index in the submitted array.

Batch, expiry, qty, free, rate, MRP, and GST may be null or blank on save. A blank batch is stored as null in the response. A non-blank value must already be well formed:

- Batch is text, trimmed, 1 to 40 characters. Otherwise `Row N: Batch number is not valid`.
- Expiry is `YYYY-MM` for a real month, including a past month. Otherwise `Row N: Expiry is not valid`.
- Qty and free are whole numbers, zero or more. Otherwise `Row N: Quantity must be a whole number`.
- Rate and MRP are zero or more, with at most two decimal places. Otherwise `Row N: Rate is not valid` or `Row N: MRP is not valid`.
- GST is 0, 5, 12, or 18. Otherwise `Row N: GST percent is not recognised`.

The same product id and trimmed batch, including two blank batches, is 400 `This product and batch is already on the list`. Nothing is written when any row fails.

`DELETE /api/v1/inventory-prep/{id}` responds 204 and removes the list and its rows.

`POST /api/v1/inventory-prep/{id}/export` reads the saved rows and does not change them. Zero rows is 400 `Add at least one row`. Each row must be complete: batch present, expiry present, qty and free present, at least one of qty or free above zero, rate present, MRP present, and GST one of 0, 5, 12, or 18. The detail names the row: `Row N: Batch number is required`, `Row N: Expiry is not valid`, `Row N: Quantity must be a whole number`, `Row N: Add at least one unit`, `Row N: Rate is not valid`, `Row N: MRP is not valid`, or `Row N: GST percent is not recognised`.

Each product id must match exactly one catalog product. An id in neither catalog is `Row N: Product was not found`. An id in both catalogs is `Row N: Product id is ambiguous`. When the catalog database cannot be reached, the status is 503 and the detail is `Medicine catalog is unavailable`. The stored `productName` is not replaced from the catalog.

A valid export responds 200 `text/csv; charset=UTF-8` with `Content-Disposition: attachment` and a file name taken from the list name. The header, in order, is `product_id,product_name,batch_no,expiry,qty,free,rate,mrp,gst`. Values that contain a comma, quote, or line break are quoted. Rate and MRP have two decimal places. The list stays editable after export.

| Status | Detail |
| --- | --- |
| 400 | `Name is required` |
| 400 | `Name is too long` |
| 400 | `Lines are not valid` |
| 400 | `A list can hold 2000 rows` |
| 400 | `This product and batch is already on the list` |
| 400 | `Add at least one row` |
| 400 | `Row N: …` as listed above |
| 403 | `This action is not allowed.` |
| 404 | `List was not found` |
| 409 | `List name already exists` |
| 503 | `Medicine catalog is unavailable` |

## Acceptance criteria

- A sales staff member creates a named list, saves a row with a blank batch, and reads it back. Another account does not see that list and receives 404 for its id.
- A second list with the same name, ignoring case, is 409. The first list is unchanged.
- Export of a blank batch is 400 and names row 1. Export of a complete row whose product id is missing from the catalog is 400 `Row 1: Product was not found`.
- After that product exists in exactly one catalog, export returns the CSV header and that row, and a later save still succeeds.

## Tests

- `PrepRulesTest` for a blank draft, a repeated batch, the 2,000 cap, a complete export line, and CSV quoting.
- `PrepControllerTest` for 403 without a session, 403 for support, and 404 for another owner's id.
- `PrepExportIT` for a saved draft, a CSV body, and a missing catalog id.
- Bruno `prep/create-list.bru`, `prep/list-lists.bru`, `prep/save-lines.bru`, `prep/export-list.bru`, `prep/rename-list.bru`, and `prep/delete-list.bru`.
