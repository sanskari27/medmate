# Manage catalog

## Context

The shared drug and FMCG catalog already supports anonymous search and a whole-product create and update for a platform admin or sales staff. The admin screen is [Manage Catalog](../../admin/requirements/2026-11-15-manage-catalog.md). Products need an optional display name that stays null until an admin or sales staff member sets it. This does not read the old server-core service.

## Scope

- A nullable `display_name` on `drugs` and `otc_fmcg`.
- `displayName` on anonymous search, product read, create, and update.
- `GET /api/v1/catalog`, a paged list for a platform admin or sales staff.

## Non-goals

- A pharmacy permission key, a change to `PharmacyPermissions`, or a Manage Users row.
- Deleting a product.
- A new module, a new database, or a new ADR.
- Changing stock, the dispensary, or the anonymous search rules for `q` and `limit`.
- Reading `server_core`, `app-uploads/server-core/`, or `/medmate-repo/server-core/*`.

## Behavior

`V2__display_name.sql` adds nullable `display_name` to `drugs` and `otc_fmcg`, and a `gin_trgm_ops` index on each column. Existing rows stay null. The primary Flyway history is unchanged.

`displayName` is returned immediately after `productName` on drug and FMCG summaries and details. On create and update it is optional text. A missing or blank value is stored as null. It is not unique. `PUT` still replaces the parent and every child list, so a missing or blank `displayName` clears the stored value. The other catalog is left alone.

`GET /api/search`, `GET /api/products`, and `GET /api/products/{productId}` stay anonymous and return `displayName`. Search contains-matches `display_name` the same way it contains-matches `product_name`. Exact `product_id` match, the required `q` of 2 to 80 characters, and the limit cap stay as they are.

`GET /api/v1/catalog` uses the same check as create and update: a non-disabled platform admin, or a non-disabled staff account whose subtypes include `sales`. Anyone else, including a missing session, a pharmacy owner, and any other staff subtype, receives 403 with detail `This action is not allowed.` A bearer the existing JWT filter rejects stays 401 with detail `Session was not accepted`.

One `page` and one `size` apply to both catalogs. `page` defaults to 1. `size` defaults to 25 and must be 1 through 100. A blank, non-integer, or non-positive `page` or `size`, or a `size` above 100, is 400 with detail `Page is not valid`. The response is `{ "drug", "fmcg" }`. Each side is `{ "items", "page", "size", "total" }`. Items are the search summaries, including `displayName`. Drugs are ordered by `product_name`, then `product_id`. FMCG keeps null `product_name` last, then `product_id`. A page past the end of one side returns an empty item list, the requested `page` and `size`, and that side's real `total`.

`kind` omitted or blank is `both`. `drug` or `fmcg` returns an empty page and total 0 for the other catalog. Any other `kind` is 400 with detail `Filter is not valid`.

`q` blank is ignored. A value longer than 80 characters is 400 with detail `Query is not valid`. A shorter value matches `product_id` exactly. It contains the text, ignoring case, on `product_name`, `display_name`, `marketer_name`, and FMCG `marketing_company`. On `medicine_type`, `product_form`, and FMCG `type` it matches a case-insensitive prefix of the whole value. `displayName` on a product is that `display_name`. An unfiltered total is the exact row count, remembered until a create or update for that catalog and refreshed at least every 5 minutes. A filtered total is an exact count of the same match.

`displayName` omitted, blank, or `any` means either. `missing` is a null `display_name`. `present` is a non-null `display_name`. Any other value is 400 with detail `Filter is not valid`.

`prescription` omitted, blank, or `any` does not constrain drugs and does not drop FMCG. `yes` keeps drugs with `prescription_required` true. `no` keeps drugs with it false. Either of those forces the FMCG page to empty items and total 0. Any other value is 400 with detail `Filter is not valid`.

`form`, `medicineType`, `fmcgType`, and `marketer` are case-insensitive contains. A blank value is ignored. A value longer than 80 characters is 400 with detail `Filter is not valid`. `form` applies to both catalogs. `marketer` matches drug `marketer_name`, and FMCG `marketer_name` or `marketing_company`. A non-blank `medicineType` forces the FMCG page empty with total 0. A non-blank `fmcgType` forces the drug page empty with total 0. Setting both leaves both pages empty.

A catalog database failure on the list is 503 with detail `Medicine catalog is unavailable`.

| Status | Detail |
| --- | --- |
| 400 | `Page is not valid` |
| 400 | `Query is not valid` |
| 400 | `Filter is not valid` |
| 403 | `This action is not allowed.` |
| 503 | `Medicine catalog is unavailable` |

## Acceptance criteria

- A product created without `displayName` stores null. Anonymous search and product read return that null. Search for a later display name finds the product.
- An update that sets `displayName` stores it. An update that omits it clears it. The other catalog is unchanged.
- `GET /api/v1/catalog` without a session, and for a support staff member, is 403. A platform admin and a sales staff member receive both pages.
- `kind=drug` returns no FMCG rows. `prescription=yes` returns no FMCG rows. `fmcgType` set returns no drug rows. `kind=nope` and `size=101` are 400.
- Page 1 of a catalog with more than 25 matches returns 25 items and the real total. The other catalog keeps its own total.

## Tests

- `CatalogRulesTest` for a blank `displayName` stored as null, list-filter parsing, and a drug-only filter clearing FMCG.
- `CatalogControllerTest` for list 403, a bad filter, and `displayName` on anonymous search.
- `CatalogIT` for the new column, a paged list, public search matching `displayName`, create with null `displayName`, and an update that sets it.
- Bruno `catalog/list-products.bru`. `catalog/search-products.bru`, `catalog/read-product.bru`, `catalog/create-drug.bru`, and `catalog/update-drug.bru` include `displayName`.
