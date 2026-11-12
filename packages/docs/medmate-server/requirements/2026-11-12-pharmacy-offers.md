# Pharmacy offers

## Context

An approved pharmacy stores the discounts a later billing module will apply to each matching medicine. An offer covers every medicine in inventory, or one inventory medicine. The dispensary screen is [Offers](../../dispensary/requirements/2026-11-12-offers.md). The module boundary is [0014](../decisions/0014-pharmacy-offers.md).

## Scope

- `GET /pharmacy/offers`, `POST /pharmacy/offers`, `PATCH /pharmacy/offers/{id}`, and `DELETE /pharmacy/offers/{id}`.
- Permission keys `offers:read`, `offers:create`, `offers:update`, and `offers:delete` on the closed pharmacy catalog.
- A stored offer, its coupon, its discount, its target, and whether it is running.
- The item count, computed from the current inventory when the offer is read.

## Non-goals

- Changing MRP, posting a bill, or publishing the offer to the customer app.
- Shopper categories, start and end dates, and a rule for which overlapping offer wins.
- Deleting an offer when its medicine leaves inventory.
- Reading `server_core`, `app-uploads/server-core/`, or `/medmate-repo/server-core/*`.

## Behavior

Every route uses `Access.pharmacy` for the caller's pharmacy. An approved owner is allowed. A staff member needs the key named below. Anyone else receives 403.

`offers:read` is required to list. The detail is `Offers cannot be read`.

`offers:create` is required to create. The detail is `Offers cannot be created`.

`offers:update` is required for any patch, including a pause or resume that sends `active` alone. The detail is `Offers cannot be updated`.

`offers:delete` is required to delete. The detail is `Offers cannot be deleted`.

`GET /pharmacy/offers` returns `offers` and `products`. Offers are newest first. Products are that pharmacy's inventory medicines, `productId` and `name`, ordered by name. Create responds 201 with `offer`. Update responds 200 with `offer`. Delete responds 204. A client-sent id is ignored.

The server assigns `id`. The first offer in a pharmacy is `OFR-001`, then `OFR-002`. The number is one higher than the highest number ever assigned for that pharmacy, padded to three digits through `OFR-999` and wider after that. Deleting an offer does not reuse its number. `(pharmacy_id, id)` is unique.

An offer is `id`, `title`, `code`, `type` (`pct` or `flat`), `value`, `scope` (`all` or `product`), `target`, `active`, and `itemCount`. `code` is the coupon, stored uppercased and trimmed. It is not unique. `value` is a positive amount with at most two decimal places. A percent is not capped. `target` is an inventory product id, or null when the scope is all. `itemCount` is the number of current inventory products, or 1 when the named product is still in inventory and 0 when it is not. The offer remains if that product later leaves inventory. There is no customer-app flag.

Create stores a trimmed title and `active` true. Scope `all` stores a null target even when a target is sent. Scope `product` requires a product id that is in this pharmacy's inventory. An omitted field on update stays as stored. Sending scope `all` clears the target. Sending a new product target checks that medicine again. A patch that leaves the existing product id unchanged still saves when that medicine has left inventory.

| Status | Detail |
| --- | --- |
| 400 | `Title is required` |
| 400 | `Coupon code is required` |
| 400 | `Discount type is not recognised` |
| 400 | `Discount must be greater than zero` |
| 400 | `Discount is invalid` |
| 400 | `Scope is not recognised` |
| 400 | `Product is required` |
| 400 | `Product was not found` |
| 400 | `Status is not recognised` |
| 403 | `Offers cannot be read` |
| 403 | `Offers cannot be created` |
| 403 | `Offers cannot be updated` |
| 403 | `Offers cannot be deleted` |
| 404 | `Offer was not found` |
| 404 | `Pharmacy was not found` |

## Acceptance criteria

- The first two offers in a pharmacy are `OFR-001` and `OFR-002`. A later offer after a delete is `OFR-003`. A staff member with `offers:read` can list them and cannot create one.
- An offer for all products counts every inventory medicine. An offer for one medicine counts 1. A product id outside the inventory is refused and stored nothing.
- A patch can change the title, coupon, discount, scope, and `active` together. Another pharmacy's list does not include the offer, and that pharmacy's patch of the id is 404.

## Tests

- `OfferRulesTest` for the title, the uppercased code, a value of zero, a third decimal, scope `all` clearing the target, a missing product, and an unknown product.
- `OfferControllerTest` for the four permission gates.
- `OfferIT` for `OFR-001` then `OFR-002`, pharmacy isolation, both item counts, a refused product, an update of the fields and `active`, and a delete.
- Bruno requests `offers/list-offers.bru`, `offers/create-offer.bru`, `offers/update-offer.bru`, and `offers/delete-offer.bru`.
