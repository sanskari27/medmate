# Manage Catalog

## Context

Platform admin and sales staff need to browse the shared drug and FMCG catalog, set an optional display name, and create or replace a whole product. The API is [Manage catalog](../../medmate-server/requirements/2026-11-15-manage-catalog.md).

## Scope

- A Manage Catalog nav item for a platform admin and for staff whose subtypes include `sales`.
- `/catalog` for the paged list and the filters.
- Create and edit routes that send the whole product.

## Non-goals

- The dispensary portal.
- A pharmacy permission key or a Manage Users row.
- Reviews, Pharmacies, Support, and Leads.
- Deleting a product.

## Behavior

`canManageCatalog` is true for `accountType` `admin` and for staff whose subtypes include `sales`. That check shows the nav item and opens the catalog routes. Other staff who open any of those paths go to `/dashboard`. The nav label is Manage Catalog, the section is Catalog, and the sub line is Drugs and FMCG. It uses the existing prescription icon.

`/catalog` requests `GET /api/v1/catalog` with `page` and `size` 25 through the portal API client. Filters sit above the rows: kind (both, drug, FMCG), text, display name (either, missing, present), prescription (any, yes, no), form, medicine type, FMCG type, and marketer. An empty choice is omitted. The text field updates as the user types and sends `q` 300ms after typing pauses. Kind and the other filters send immediately. Changing a filter returns to page 1. The response has a drug section and an FMCG section. Each section shows its total. A row links to the editor for that kind and shows the product name, the display name or `No display name`, the id, and the marketer. One page bar uses the larger total. An empty drug side says `No drugs match.` An empty FMCG side says `No FMCG products match.` `New drug` links to `/catalog/drugs/new`. `New FMCG` links to `/catalog/fmcg/new`.

`/catalog/drugs/new` and `/catalog/fmcg/new` start an empty product. `productId` is entered. Save sends `POST /api/v1/catalog/drugs` or `POST /api/v1/catalog/fmcg`.

`/catalog/drugs/:productId` and `/catalog/fmcg/:productId` load `GET /api/products/{productId}` and use the array for that kind. A missing product shows the problem detail. `productId` is read-only. Save sends `PUT` to the matching catalog path with the path id.

The form includes `displayName` and every other parent field, then each child list. Adding or editing a child row opens a dialog, except categories, which are chips on a shelf. A category is typed in place and committed with Enter or Add, and a chip renames in place. Removing a row stays on the list. The on-screen order is the order sent. Drug children are ingredients, safety, facts, uses, side effects, questions, interactions, and images. FMCG children are categories, highlights, ingredients, benefits, safety, and images. Required fields are `productId`, `productName`, drug `prescriptionRequired`, and each child row's required text. A blank `displayName` is omitted so the server stores null. A failed load or save shows the problem detail, including 400, 403, 404, 409, and 503.

## Acceptance criteria

- Admin and sales see Manage Catalog. Support opening `/catalog` lands on Home.
- The list requests size 25, sends the selected filters, shows both sections, and opens a row.
- Create sends the whole product. Edit loads the product, sends a display name, and shows `Product already exists` on 409.

## Tests

- `portalAccount.test.ts` for `canManageCatalog`.
- `AppRouter.test.tsx` for the nav item and the support redirect.
- `CatalogPage.test.tsx` for the filters, the two sections, and an empty side.
- `CatalogEditorPage.test.tsx` for create, a display-name save, a 409 message, and adding a category on the shelf.
