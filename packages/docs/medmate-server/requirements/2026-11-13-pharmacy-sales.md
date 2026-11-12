# Pharmacy sales

## Context

An approved pharmacy already posts a cash bill from [Pharmacy billing](2026-11-12-pharmacy-billing.md). Staff need the list of those bills, the invoice again, and a partial return that puts the units back on the same batch. The dispensary screen is [Sales](../../dispensary/requirements/2026-11-13-sales.md). The module boundary is [0017](../decisions/0017-pharmacy-sale-returns.md).

## Scope

- `GET /pharmacy/sales`, `GET /pharmacy/sales/{id}`, and `POST /pharmacy/sales/{invoiceNumber}/returns`.
- Permission keys `sales:read` and `sales:return` on the closed pharmacy catalog. `sales:read` lists and opens a document. `sales:return` saves a return.
- A stored return, its lines, and `returned_qty` on the bill line.
- Stock increased on the sold batch through `CounterStock.increment`.

## Non-goals

- Search, a date filter, paging, editing, or deleting a bill or a return.
- A credit-note print, a customer ledger, and UPI or card refunds.
- Loose units and a customer-app checkout.
- A new Maven module.
- Reading `server_core`, `app-uploads/server-core/`, or `/medmate-repo/server-core/*`.

## Behavior

Every route uses `Access.pharmacy` for the caller's pharmacy. An approved owner is allowed. A staff member needs the key named below. Anyone else receives 403.

`sales:read` is required to list and to read one document. The detail is `Sales cannot be read`.

`sales:return` is required to save a return. The detail is `Sales cannot be returned`. `sales:read` does not save a return.

`GET /pharmacy/sales` returns that pharmacy's invoices and returns, newest `recordedAt` first, then id. The response is `sales` and `stats`. A row is `id`, `type` (`sale` or `return`), `invoiceNumber`, `patientName`, `recordedAt`, `items`, and `amount`. `items` is the sum of the quantities on that document. `amount` is a positive decimal string: `payable` on a sale, the refund on a return. A sale id is the invoice number. A return id is `RET-001`, then `RET-002`, for that pharmacy. The number is one higher than the highest return number ever assigned there. It is not reused.

`stats` uses the Asia/Kolkata calendar month of `recordedAt`. `salesThisMonth` and `saleCount` cover invoices. `returnsThisMonth` and `returnCount` cover returns. `netThisMonth` is sales minus returns and may be negative. Money fields are decimal strings with two places. A return of an older invoice counts in the month it was saved.

`GET /pharmacy/sales/{id}` returns one `sale`. An id outside this pharmacy is 404 with detail `Sale was not found`. A sale document is the stored bill plus `returnedQty` on each line, and `amount` equal to `payable`. A return document is `type` `return`, the return id, the original invoice number, the patient name and phone, `recordedAt`, `amount`, and `lines`. A return line is `position`, `name`, `batchNo`, `expiry`, `qty`, and `amount`.

`POST /pharmacy/sales/{invoiceNumber}/returns` returns 201 with `sale` set to the return document. The body is `lines` of `position` and `qty`. A client-sent amount is ignored. A qty of zero is skipped. At least one unit is required. A missing or repeated position, a position off the invoice, or a qty above the units not yet returned stores nothing. The detail is `Return is more than the quantity sold`. A qty that is not a whole number, or is negative, is `Quantity is not valid`. No unit at all is `A line is required`. An unknown invoice is 404 `Sale was not found`.

Line net is `unitPrice * qty`. Bill net is the sum of line nets. The stored `extraAmount` is spread across lines with a positive net. Each such line except the last is half-up to two decimal places of `extraAmount * lineNet / billNet`. The last positive line takes the remainder, so the shares sum to `extraAmount`. A zero net gets no share. When every line net is zero, every share is zero. Line payable is line net minus that share.

Line payable is split into paise across the sold units. Each unit gets the floor. The earliest units get one extra paisa. A return consumes the earliest units that are not yet returned. The refund is the sum of those unit shares. Returning every remaining unit of every line pays back the original `payable`.

The batch quantity grows by the returned quantity in the same transaction as the insert, through `CounterStock.increment`. `returned_qty` on the bill line grows by the same quantity. An expired batch still accepts the units. A missing batch stores nothing. The detail is `Batch was not found`. Another pharmacy's bill, return number, or stock is untouched.

| Status | Detail |
| --- | --- |
| 400 | `A line is required` |
| 400 | `Quantity is not valid` |
| 400 | `Return is more than the quantity sold` |
| 403 | `Sales cannot be read` |
| 403 | `Sales cannot be returned` |
| 404 | `Sale was not found` |
| 404 | `Batch was not found` |
| 404 | `Pharmacy was not found` |

## Acceptance criteria

- A staff member with `sales:read` can list and open a bill. A staff member with only `sales:return` cannot. A staff member with `sales:return` can save a return. A staff member with only `sales:read` cannot.
- The first return in a pharmacy is `RET-001`. One unit of a three-unit line whose payable is `10.00` refunds `3.34`. The next two units refund `6.66`. A full return of every line equals the original `payable`.
- A return raises the chosen batch. An over-return stores nothing and leaves the batch unchanged. A return saved this month against a bill from an earlier month makes `netThisMonth` negative. Another pharmacy receives 404 and its stock does not change.

## Tests

- `SaleReturnRulesTest` for the extra spread, the earliest-unit paise, a second return, a full return equaling `payable`, and a zero bill net.
- `SaleControllerTest` for the read and return gates.
- `SaleIT` for list order, month stats including a negative net, stock restored on the chosen batch, an over-return that stores nothing, and pharmacy isolation.
- Bruno requests `sales/list-sales.bru`, `sales/read-sale.bru`, and `sales/return-sale.bru`.
