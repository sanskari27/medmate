# Admin pharmacy insights

## Context

The admin home was empty, and a pharmacy page showed the application and the block state. Sales, stock, purchases, credit, expenses, staff, CRM, and support are already stored. The money rules are the pharmacy dashboard and the 23 reports. The module boundary is [0023](../decisions/0023-admin-pharmacy-insights.md). The admin screen is [Pharmacy fleet](../../admin/requirements/2026-11-14-pharmacy-insights.md).

## Scope

- `GET /pharmacy-insights` for a platform admin and for platform staff who can read pharmacy owners.
- `GET /pharmacy-insights/{id}` for the same readers. `range` is `7d`, `30d`, or `12m`. An omitted range is `30d`.
- `GET /pharmacy-owners/{id}` also returns `createdAt`, `extraDetails`, `reviews`, and `blockHistory`.

## Non-goals

- A new table, Flyway version, or permission key.
- Patient names, phones, conditions, allergies, or prescription numbers.
- Employee Aadhaar, PAN, bank account, UPI, or salary.
- Invoice template, accent, title, signatory, bank line, and print toggles.

## Behavior

Dates are Asia/Kolkata calendar dates. Money is half-up to paise and is a decimal string. A reader who is not a directory reader is HTTP 403 with detail `Pharmacy insights are not available`. An unknown pharmacy is HTTP 404 with detail `Pharmacy was not found`. Any other `range` is HTTP 400 with detail `The date range is not valid.`

The fleet counts pharmacies by verification status, type, city, state, industry, registration, and business type. It counts approved, blocked, compliance review, final review, incomplete, and rejected. It reports median days from created to submitted and from submitted to the latest review decision, feature adoption, approved pharmacies with no bill since approval, open support cases, and the median hours to resolve a case. Rankings are the top five over the last 30 days for net sales, credit outstanding, return rate, and expiring-stock value, plus the pharmacies with the most open tickets.

One pharmacy reuses the dashboard snapshot and the sales summary, profit and loss, GSTR-3B, and receivable ageing reports. It adds return count and return rate, distributor outstanding, last sale and last purchase, stock counts, prescription share, racks, staff and employee counts, patient and CRM counts, active offers, and support cases. Return rate is the return amount divided by net sales plus that return amount. Distributor outstanding is the opening balance plus purchase ledger amounts, minus payments and return ledger amounts. A blank batch expiry counts as expired. Expiring batches are those with quantity whose expiry month is this month through four months ahead.

`reviews` is every review decision, oldest first, with stage, decision, comment, actor name, and time. `blockHistory` is every closed block request. The open request stays on `request`.

## Acceptance criteria

- A platform admin and a platform staff member receive the fleet and one pharmacy. A pharmacy owner is refused with `Pharmacy insights are not available`.
- `range=year` is 400 with `The date range is not valid.` A missing pharmacy is 404 with `Pharmacy was not found`.
- A posted cash bill is visible as today's bill count and as fleet net sales. The owner detail includes `createdAt`, `extraDetails`, `reviews`, and `blockHistory`.

## Tests

- `InsightRulesTest` for an empty snapshot, distributor outstanding, dormant approval, median, and expired versus expiring stock.
- `InsightControllerTest` for an admin, a staff member, a pharmacy account, a bad range, and a missing pharmacy.
- `InsightIT` posts a cash bill and reads the fleet, the pharmacy, and the owner detail.
- Bruno `bruno/medmate/insights/get-fleet.bru` and `get-pharmacy.bru`.
