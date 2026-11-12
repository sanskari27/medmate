# Pharmacy racks and locations

## Context

An approved pharmacy stores where each inventory product is placed. The code belongs to the product, not to a batch. A rack can exist before any product is placed on it. The dispensary screen is [Racks and locations](../../dispensary/requirements/2026-11-12-racks-and-locations.md). The module boundary is [0015](../decisions/0015-pharmacy-racks.md).

## Scope

- `GET /pharmacy/racks` and `POST /pharmacy/racks`.
- `PATCH /pharmacy/inventory/{productId}/location` and `POST /pharmacy/inventory/location/bulk`.
- `rack` and `rackAlt` on `GET /pharmacy/inventory` and `GET /pharmacy/inventory/{productId}`.
- Permission keys `racks:read`, `racks:create`, `racks:update`, and `racks:export` on the closed pharmacy catalog.
- Nullable `rack` and `rack_alt` on `inventory_product`, and a `rack` table for the empty-rack list. The migration is `V13__racks.sql`.

## Non-goals

- A delete route for a rack or a placement.
- Storing the location on a batch.
- A server file for the audit spreadsheet. Export is built in the browser.
- Category, schedule, HSN, GST, and loose units.
- Reading `server_core`, `app-uploads/server-core/`, or `/medmate-repo/server-core/*`.

## Behavior

Every new route uses `Access.pharmacy` for the caller's pharmacy. An approved owner is allowed. A staff member needs the key named below. Anyone else receives 403. A failed permission check writes nothing.

`racks:read` is required to list racks. The detail is `Racks cannot be read`.

`racks:create` is required to add an empty rack. The detail is `Racks cannot be created`.

`racks:update` is required to set one location and to bulk-assign. The detail is `Racks cannot be updated`.

`racks:export` is stored in the catalog and gates the dispensary button. This server does not have an export route.

`inventory:read` still gates both inventory reads. Those responses gain `rack` and `rackAlt`. `inventory:update` still changes only the reorder level.

A code is trimmed and uppercased. A blank code is stored as null. `A3-12` is the primary slot. The second slot is optional.

`GET /pharmacy/racks` returns `racks` and `products`. `racks` is the registry for that pharmacy, sorted by code. `products` is the same shape as inventory, including `rack` and `rackAlt`.

`POST /pharmacy/racks` accepts `rack`. A blank code is 400 with detail `Rack code is required`. A code already in the registry is 409 with detail `That rack already exists`. Create responds 201 with the same body as the list.

`PATCH /pharmacy/inventory/{productId}/location` accepts `rack` and `rackAlt`. A field that is absent stays as it is. A field that is present and blank, or JSON null, is cleared. Sending a primary code does not clear the second slot. An unknown product is 404 with detail `Product was not found`. The response is `product`.

`POST /pharmacy/inventory/location/bulk` accepts `ids` and `rack`. `ids` is 1 to 200 distinct product ids. A blank rack is 400 with detail `Rack code is required`. An empty id list is 400 with detail `Product is required`. More than 200 ids is 400 with detail `A location can be set on at most 200 products`. The primary code is set and each second slot is kept. An unknown id is 404 with detail `Product was not found` and nothing is written. The response matches the list.

A purchase does not change either location field.

| Status | Detail |
| --- | --- |
| 400 | `Rack code is required` |
| 400 | `Product is required` |
| 400 | `A location can be set on at most 200 products` |
| 403 | `Racks cannot be read` |
| 403 | `Racks cannot be created` |
| 403 | `Racks cannot be updated` |
| 404 | `Product was not found` |
| 409 | `That rack already exists` |

## Acceptance criteria

- A created rack appears in `racks` before any product uses it. Creating it again changes nothing and returns 409.
- Setting a primary code keeps the second slot when `rackAlt` is absent. An empty `rack` clears only the primary code and leaves the registry row.
- Bulk assign sets the primary code and keeps each second slot. One unknown id writes nothing.
- A staff member with `racks:read` can list racks and cannot create one. A staff member with `inventory:read` can see `rack` on inventory and cannot change it.
- Another pharmacy cannot read the rack or the placement.

## Tests

- `RackRulesTest` for normalize, a blank create, a duplicate code, a bulk assign that keeps the second slot, and a patch that clears only the field that was emptied.
- `StockControllerTest` for the four routes, including 403.
- `AccessTest` for the four keys.
- Bruno: `racks/list-racks.bru`, `racks/create-rack.bru`, `racks/set-location.bru`, and `racks/bulk-location.bru`.

The module is [0015](../decisions/0015-pharmacy-racks.md).
