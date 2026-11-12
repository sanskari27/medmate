# Pharmacy distributors

## Context

An approved pharmacy records the firms that supply its medicine, and what it still owes each one. Outstanding is the opening balance plus purchase bills, minus payments and returns. The dispensary screen is [Distributors](../../dispensary/requirements/2026-11-12-distributors.md). The module boundary is [0012](../decisions/0012-distributor-directory.md).

## Scope

- `GET /pharmacy/distributors` and `GET /pharmacy/distributors/{code}`.
- `POST /pharmacy/distributors` and `PATCH /pharmacy/distributors/{code}`.
- `POST /pharmacy/distributors/{code}/payments`.
- Permission keys `distributors:read`, `distributors:create`, `distributors:update`, `distributors:delete`, and `distributors:pay` on the closed pharmacy catalog.
- Ledger lines of type `purchase`, `payment`, and `return`. This change's HTTP API inserts `payment` lines only.

## Non-goals

- A Purchases screen, a Returns screen, purchase import, and an HTTP route that creates a bill or a return.
- A delete route.
- Reading `server_core`, `app-uploads/server-core/`, or `/medmate-repo/server-core/*`.

## Behavior

Every route uses `Access.pharmacy` for the caller's pharmacy. An approved owner is allowed. A staff member needs the key named below. Anyone else receives 403.

`distributors:read` is required for both reads. The detail is `Distributors cannot be read`.

`distributors:create` is required to create. The detail is `Distributors cannot be created`.

`distributors:update` is required for any change other than a transition from Active to Inactive. The detail is `Distributors cannot be updated`.

`distributors:delete` is required only when Active changes to Inactive, on create or on update. Keeping an already inactive distributor does not require it. Switching back to Active uses update. The detail is `Distributors cannot be set inactive`. A request that needs a missing key changes nothing.

`distributors:pay` is required to record a payment. The detail is `Distributors cannot be paid`.

`GET /pharmacy/distributors` returns that pharmacy's distributors ordered by code number. `GET /pharmacy/distributors/{code}` returns one `distributor`. A code outside this pharmacy is 404 with detail `Distributor was not found`.

Each distributor is `id` (the code), `name`, `contactPerson`, `phone`, `email`, `gstin`, `drugLicenceNumber`, `address`, `city`, `state`, `paymentTerms`, `openingBalance`, `outstanding`, `active`, `showInPurchases`, and `transactions`. A transaction is `id`, `type` (`purchase`, `payment`, or `return`), `amount`, `reference`, `note`, `mode` (`cash`, `upi`, `card`, or `bank_transfer` for a payment, otherwise null), and `recordedAt` (an ISO-8601 instant). Transactions are oldest first. Amounts are whole rupees.

`outstanding = openingBalance + purchase bills − payments − returns`.

The server assigns `id`. The first distributor in a pharmacy is `DST-001`, then `DST-002`. The number is one higher than the highest code for that pharmacy, padded to three digits through `DST-999` and wider after that. A client-sent id is ignored. The code is not changed and is not reused. `(pharmacy_id, code)` is unique. Ledger ids are `TXN-001` upward inside the pharmacy, also not reused.

Create requires a trimmed name and a trimmed phone. The phone is not checked as an Indian mobile number and is not unique. Name, phone, email, and GSTIN are not unique. Payment terms are `Advance`, `On delivery`, `7 days credit`, `15 days credit`, `30 days credit`, or `45 days credit`, default `30 days credit`. `openingBalance` is a non-negative whole number of rupees, default 0. `active` defaults to true. `showInPurchases` defaults to true. A present GSTIN must match `^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z][1-9A-Z]Z[0-9A-Z]$` after uppercasing, and is stored uppercased. Drug licence is stored uppercased and is not format-checked. Contact person, email, address, city, and state are optional and are not format-checked. Blank optional text is stored as null.

An omitted field on update stays as stored. A present blank optional text clears it. After any ledger line exists, a different `openingBalance` is refused with `Opening balance is locked`. Sending the same opening balance is allowed.

A payment body is `amount`, `mode`, and an optional `note`. The amount is a whole number of rupees, at least 1, and at most the current outstanding. The mode is `cash`, `upi`, `card`, or `bank_transfer`. The line is recorded at the server's current instant. A payment that would pass the outstanding stores nothing. The same cap applies to a return line accepted by the domain rule. A purchase line increases outstanding and has no upper cap. Create responds 201. Reads, update, and pay respond 200. Pay returns the distributor.

| Status | Detail |
| --- | --- |
| 400 | `Name is required` |
| 400 | `Phone is required` |
| 400 | `Payment terms are not recognised` |
| 400 | `GSTIN is invalid` |
| 400 | `Outstanding must be zero or more` |
| 400 | `Status is not recognised` |
| 400 | `Show in purchases is not recognised` |
| 400 | `Opening balance is locked` |
| 400 | `Payment must be at least 1` |
| 400 | `Payment is more than the outstanding` |
| 400 | `Payment mode is not recognised` |
| 400 | `Return is more than the outstanding` |
| 403 | `Distributors cannot be read` |
| 403 | `Distributors cannot be created` |
| 403 | `Distributors cannot be updated` |
| 403 | `Distributors cannot be set inactive` |
| 403 | `Distributors cannot be paid` |
| 404 | `Distributor was not found` |

## Acceptance criteria

- The first two distributors in a pharmacy are `DST-001` and `DST-002`. A staff member with `distributors:read` can list them and cannot create one.
- A stored purchase line increases outstanding. A payment reduces it and cannot exceed what is still owed.
- After any ledger line, a different opening balance is refused and the stored opening balance stays.
- Another pharmacy's list does not include the distributor, and that pharmacy's read of the code is 404.

## Tests

- `DistributorRulesTest` for GSTIN, terms, the inactive gate, the opening-balance lock after any line, a purchase that increases outstanding, a return that decreases it, and a payment that would pass the balance.
- `DistributorControllerTest` for the five permission gates.
- `DistributorIT` for `DST-001` then `DST-002`, pharmacy isolation, a payment reducing outstanding, a stored purchase line increasing it, and a locked opening balance.
- Bruno: `distributors/list-distributors.bru`, `distributors/create-distributor.bru`, `distributors/update-distributor.bru`, and `distributors/record-payment.bru`.

The module is [0012](../decisions/0012-distributor-directory.md).
