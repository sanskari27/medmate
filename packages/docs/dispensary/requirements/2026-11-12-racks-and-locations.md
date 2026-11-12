# Racks and locations

## Context

An approved pharmacy records where each product sits on the shelves. The dispensary Catalogue gains the pharmacy Rack & Locations screen: the map, Assign locations, empty racks, printed labels, and the audit spreadsheet. Clicking a product opens the inventory product dialog. The pharmacy app stays untouched and is not imported. The API is [Pharmacy racks and locations](../../medmate-server/requirements/2026-11-12-pharmacy-racks-and-locations.md).

## Scope

- A Catalogue item, Rack & Locations, after Inventory, for an approved owner and for pharmacy staff who hold `racks:read`.
- `/racks`.
- Creating an empty rack, assigning a primary code, an optional second slot, printed labels, and an audit spreadsheet.
- The same placement on the inventory list and the inventory product dialog.
- The Manage Users dialog gains the Rack & Locations module under Catalogue, after Inventory.

## Non-goals

- Deleting a rack or a placement from the rack screen. Clearing a code on the product dialog is the way to remove a placement.
- Billing, and a separate medicine popup.
- Category, schedule, HSN, GST, and loose units.
- The admin portal and the pharmacy app.

## Behavior

The nav order under Catalogue is Distributors, Purchases, Inventory, Rack & Locations, Offers. The first visible Catalogue item carries the heading. An approved owner always sees Rack & Locations. A staff member sees it only with `racks:read`. Create, Update, or Export alone leave the item hidden, and `/racks` sends that person to the dashboard. The nav icon is the store icon. The shell title is Rack & Locations and the subtitle is `Where each medicine is stored on the shelves`.

The page loads `GET /pharmacy/racks` through the portal API client. Four cards follow, in order: Racks created (hint `cupboards & shelves`), Racks / zones (hint `in use`), Medicines mapped (hint `with a location`), and No location yet (hint `need allocating`). Racks created counts location groups, including empty registry racks. Zones count the distinct leading letter groups. Medicines mapped counts products with a primary code. No location yet counts the rest.

The controls under the cards are the tabs Rack map and Assign locations, then the search field `Search medicine or rack code (e.g. A3-12)…`, then Audit Excel, then Print rack labels. Assign locations shows the unassigned count when it is above zero. Search matches name, composition, marketer, and either location code, and it also matches a rack code on the map.

Audit Excel is shown only with `racks:export`. Print rack labels is shown to anyone who can open the screen. Both run in the browser. The audit file is one row per batch, sorted by rack then name. A product with no batch still produces one row. Columns are Rack, 2nd slot, Medicine, Composition, Marketer, Pack, Form, Type, Batch no., Expiry, Months to expiry, Status, Qty, Rate, MRP, Cost value, and Retail value. A missing primary code is `UNASSIGNED`. Status is Expired, `Expiring (Nmo)` through the current month plus four, or OK. The label sheet lists one label per location group, including an empty rack.

Rack map shows Create a rack when the person has `racks:create`. The field uppercases as typed. Add rack stays disabled while the field is blank. `POST /pharmacy/racks` saves it. A duplicate shows `That rack already exists`. The cards then show each code, the item count, and the products in that rack. An empty card says `Empty — click to add medicines`. A card opens the rack dialog.

The rack dialog title is Rack and the code. Search finds products that are not already in that rack. Choosing one sends `PATCH /pharmacy/inventory/{productId}/location` with `rack` set to that code and without `rackAlt`, so the second slot stays. There is no remove control and no delete control. Done closes the dialog.

Clicking a product, on a card or in the dialog, opens the inventory product dialog.

Assign locations starts with Rack, Shelf, and Bin. `A`, `3`, and `12` compose `A3-12`. The hint explains rack, shelf, then bin. Assign to the selected rows stays disabled until a code and a selection are present. It sends `POST /pharmacy/inventory/location/bulk` and keeps each second slot. Show only medicines with no location is checked on open. The table columns are the selector, Medicine, Stock, Current location, and Set location. Current location joins the primary code and the second slot with ` · `. Set location saves the primary code. Save stays disabled when the value is blank or unchanged. The fill control copies the composed code into the row. An empty unset list says `Every medicine has a location. Nice and tidy!`

Anyone who can open Inventory sees a Location column after Product. The product dialog shows Rack location as read-only text. With `racks:update`, that detail becomes Rack location and 2nd slot fields and saves both on `PATCH /pharmacy/inventory/{productId}/location`. An empty field clears that slot. `inventory:update` does not reveal these fields, and the reorder control stays absent. A failed save shows the problem detail.

The permission dialog lists Rack & Locations after Inventory and before Offers. The actions are Read, Create, Update, and Export. The keys are `racks:read`, `racks:create`, `racks:update`, and `racks:export`. The access count is `n / 31`.

## Acceptance criteria

- An owner sees Catalogue as Distributors, Purchases, Inventory, Rack & Locations, and Offers. A staff member with `racks:read` sees the item. A staff member with only `racks:create` who opens `/racks` lands on the dashboard.
- The map shows an empty registry rack and a product that already has a code. Assign locations can hide products that already have a primary code.
- Add rack is absent without `racks:create`. Audit Excel is absent without `racks:export`. Print rack labels remains.
- Clicking a product opens the inventory product dialog.
- The inventory list shows the location to a person with `inventory:read`. The two fields are absent without `racks:update`, and saving them calls the location route.
- The Manage Users dialog includes Rack & Locations Read, Create, Update, and Export. The access count uses 31.

## Tests

- `catalog.test.ts` for Rack & Locations after Inventory and the thirty-one keys.
- `UsersPage.test.tsx` for `n / 31` and the Rack & Locations rows.
- `model.test.ts` for composing a code, grouping racks, the unassigned list, and the audit file.
- `RacksPage.test.tsx` for the cards, the map and assign tabs, create hidden without `racks:create`, export hidden without `racks:export`, and a product opening the inventory dialog.
- `InventoryPage.test.tsx` for the location column, the fields hidden without `racks:update`, and a save that calls the location route.
- `AppRouter.test.tsx` for Catalogue order, a staff member with `racks:read`, and a staff member without it sent from `/racks` to the dashboard.
