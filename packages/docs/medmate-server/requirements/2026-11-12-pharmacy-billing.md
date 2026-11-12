# Pharmacy billing

## Context

An approved pharmacy sells from the counter. The dispensary screen is [Billing](../../dispensary/requirements/2026-11-12-billing.md). The module boundary is [0016](../decisions/0016-pharmacy-billing.md). Offers already store the discounts. Inventory already stores the batches. This module posts the cash sale, applies one winning offer per line, and reduces the chosen batch.

## Scope

- `POST /pharmacy/bills`.
- Permission keys `billing:read` and `billing:create` on the closed pharmacy catalog. `billing:read` opens the screen. `billing:create` posts the sale.
- `prescription_required` on the inventory product, filled from the medicine catalog.
- `gst` on the inventory batch, copied from the purchase line that received it.
- A stored cash bill, its patient, its prescription fields when a line needs them, and its lines.

## Non-goals

- A bill list, a reprint route, returns, loose units, and UPI or card capture.
- A customer-app checkout.
- Reading `server_core`, `app-uploads/server-core/`, or `/medmate-repo/server-core/*`.

## Behavior

Every route uses `Access.pharmacy` for the caller's pharmacy. An approved owner is allowed. A staff member needs the key named below. Anyone else receives 403.

`billing:read` does not post a bill.

`billing:create` is required to post. The detail is `Bills cannot be created`.

`POST /pharmacy/bills` returns 201 with `bill`. A client-sent id or total is ignored. The server assigns the number and recomputes every price.

The number is the pharmacy invoice prefix plus a four-digit counter. The first bill is `{prefix}0001`, then `{prefix}0002`. The counter is one higher than the highest number ever assigned for that pharmacy. Deleting is not in scope, so the number is not reused. The prefix is the stored invoice prefix. `(pharmacy_id, number)` is unique.

The body is `patientName`, `patientPhone`, `prescribedBy`, `prescriptionNumber`, `payMode`, `discount`, and `lines`. Each line is `productId`, `batchNo`, `qty`, and `discount`. A discount is `type` (`none`, `percent`, or `flat`) and `value`. A missing discount is `none`. `payMode` must be `cash`. `patientName` is trimmed and required. `patientPhone` is exactly ten digits. `qty` is an integer of at least 1. A percent above 100, a negative value, or an unknown type is `Discount is not valid`.

A line needs a batch that belongs to this pharmacy and product, still has stock, and is not expired. Expiry is `YYYY-MM`. A batch is expired when that month is before the current month in Asia/Kolkata. The sold quantity cannot exceed the batch quantity. The batch GST rate must be `0`, `5`, `12`, or `18`. Null is unknown and the line is refused. GST `0` is allowed.

`prescriptionRequired` is stored on the inventory product. A drug snapshot uses the catalog flag. An FMCG snapshot stores false. `GET /pharmacy/inventory` looks up any product whose flag is still null, saves the result, and returns it. A product whose flag is still null cannot be sold. When any sold line has the flag true, `prescribedBy` and `prescriptionNumber` are trimmed and required. Otherwise both are stored null even when sent.

Only an active offer applies. A product offer matches that product id. An all-products offer matches every line. A paused offer does not apply. A product offer whose product is no longer in inventory does not apply. Per unit, a percent is `value / 100 * MRP`. A flat amount is `value` rupees, capped at that unit's MRP. The unit saving is rounded to two decimal places. The line saving is that unit saving times quantity. The offer with the larger rupee saving wins. A tie goes to the product offer. A remaining tie goes to the higher offer number. The unit price is MRP minus the unit saving and is never negative. The price is GST-inclusive.

The response `bill` is `number`, `patientName`, `patientPhone`, `prescribedBy`, `prescriptionNumber`, `payMode` (`cash`), `soldAt`, `subtotal`, `discount`, `payable`, `extraType`, `extraValue`, `extraAmount`, and `lines`. A line is `productId`, `name`, `composition`, `batchNo`, `expiry`, `qty`, `mrp`, `unitPrice`, `gst`, `offerId`, `offerTitle`, and `discount`. Money fields are decimal strings with two places. `subtotal` is the MRP total. A line discount is the offer plus an extra percent or rupee amount taken from the unit price after the offer, and that unit price cannot go below zero. `extraAmount` is a further percent or rupee amount taken from the bill after those lines, capped at the amount still due. `discount` is every saving. `payable` is what the customer pays.

The batch quantity is reduced by the sold quantity in the same transaction as the insert. Another pharmacy's product, batch, or bill number is untouched.

| Status | Detail |
| --- | --- |
| 400 | `Patient name is required` |
| 400 | `Phone is not valid` |
| 400 | `Prescribed by is required` |
| 400 | `Prescription number is required` |
| 400 | `A line is required` |
| 400 | `Batch is required` |
| 400 | `Quantity is not valid` |
| 400 | `Payment type is not available` |
| 400 | `Discount is not valid` |
| 400 | `Batch is expired` |
| 400 | `GST rate is unknown` |
| 400 | `Prescription status is unknown` |
| 403 | `Bills cannot be created` |
| 404 | `Batch was not found` |
| 404 | `Pharmacy was not found` |
| 409 | `Not enough stock` |

`GET /pharmacy/inventory` adds `prescriptionRequired` on each product and `gst` on each batch. `gst` is a number or null. A purchase that receives a batch copies that line's GST onto the batch. Existing batches are backfilled from the latest purchase line for that pharmacy, product, and batch.

## Acceptance criteria

- The first two bills in a pharmacy are `{prefix}0001` and `{prefix}0002`. A staff member with `billing:read` cannot post. A staff member with `billing:create` can.
- A percent offer and a larger flat offer on the same line keep the flat offer. An equal saving keeps the product offer. The chosen batch quantity falls by the sold quantity. Another pharmacy's stock does not change.
- A prescription line without a doctor or a prescription number is refused and stores nothing. A batch with a null GST rate is refused. GST `0` is sold. UPI is refused.

## Tests

- `BillRulesTest` for the winning offer, the flat cap, a percent, both tie breaks, an expired batch, a missing GST rate, a missing prescription flag, and the phone.
- `BillControllerTest` for the read and create gates.
- `BillIT` for `{prefix}0001` then `{prefix}0002`, pharmacy isolation, stock reduced on the chosen batch, an Rx bill refused without a doctor and prescription number, and a cash-only pay mode.
- Bruno request `bills/create-bill.bru`.
