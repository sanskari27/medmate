# Pharmacy dashboard

## Context

The dispensary screen is [Dashboard](../../dispensary/requirements/2026-11-13-dashboard.md). Every approved pharmacy owner and staff member reads one snapshot of posted rows. The money rules match [Pharmacy reports](2026-11-13-pharmacy-reports.md). This change does not read the old server-core service. The module boundary is [0021](../decisions/0021-pharmacy-dashboard.md).

## Scope

- `GET /pharmacy/dashboard` for an approved owner and for approved staff, including staff whose permission set is empty.
- An optional `range` of `7d`, `30d`, or `12m`.

## Non-goals

- A new permission key, table, or Flyway version.
- A change to `PharmacyPermissions` or to the report routes.
- Online channel, prescription review, and store open or paused.
- Reading `server_core`, `app-uploads/server-core/`, or `/medmate-repo/server-core/*`.

## Behavior

Dates are Asia/Kolkata calendar dates. Money is half-up to paise and is a decimal string. Counts are integers. An omitted `range` is `7d`. Any other value is HTTP 400 with detail `The date range is not valid.`

The reader must be an approved pharmacy owner or staff member of that pharmacy, and must not be disabled. The permission set is not consulted. Anyone else is HTTP 403 with detail `The dashboard cannot be read.`

`7d` is the 7 days ending today. `30d` is the 30 days ending today. `12m` is the 12 calendar months ending this month, from the first of the earliest month through the last day of this month. Each day or month is one bucket. A 7-day label is the weekday, a 30-day label is the day and month, and a 12-month label is the month.

A sale contributes its shared line value on the sale date. A sale return contributes the stored return amount and quantity on the return date. Cash is every move whose bill is not credit. COGS uses the sold batch rate, and a missing rate is zero. A purchase contributes `rate * qty` plus GST on the recorded date, and a purchase return negates that on the return date. An expense amount is the stored GST-inclusive amount. Credit outstanding applies repayments to the oldest credit bill first, after that bill's returns.

The body has `range`, `from`, `to`, `today`, `month`, `dues`, `stock`, `recent`, and `window`.

`today` has `netSales`, `bills`, `averageBill`, `units`, `cash`, `credit`, `spark`, `returns`, and `returnCount`. `bills` counts bills sold today. `averageBill` is `netSales` divided by `bills`, or zero when there are none. `spark` is the net sales of the 7 days ending today, oldest first. `returns` is the stored sale-return amount dated today, and `returnCount` is how many of those documents there are. `month` is the current calendar month: `netSales`, `purchases` net of purchase returns, and `expenses` as the stored GST-inclusive amount.

`dues` has `bills` and `outstanding` for credit bills that still have a balance. It ignores `range`.

`stock.low` counts products whose units are at or under the reorder level. `stock.out` counts products with nothing on hand. `stock.cost` is on-hand quantity times batch rate, and `stock.retail` is on-hand quantity times MRP. A batch with no quantity is left out. `stock.expiring` counts batches with quantity above zero whose expiry month is this month, earlier, or at most 4 months ahead. A blank expiry counts as expired. `stock.attention` is up to 5 low products, by name, each with `name`, `onHand`, and `reorder`. `stock.expiringSoon` is up to 5 of those batches, soonest first, each with `name`, `batchNo`, `expiry`, `qty`, `months`, and `expired`.

`recent` is the latest 6 bills, newest first. Each has `number`, `patient`, `payMode`, and `payable`.

`window.buckets` follows the range. Each bucket has `label`, `cash`, `credit`, `cashBills`, `creditBills`, `sales`, and `purchases`. `sales` is cash plus credit. Bill counts are bills sold in the bucket, not reduced by a later return. `window.profit` has `taxable`, `cogs`, and `gross` for the whole window. Expenses are not subtracted. `window.margin` is `gross` divided by `taxable`, times 100, or zero when taxable is zero. `window.returns` is the stored sale-return amount in the window. `window.expenses` is `{ category, amount }`, largest amount first. `window.collected` has `cash`, `upi`, and `card`. Cash is net cash sales plus cash repayments. UPI and card are repayments only. `window.topSellers` is up to 5 products with a positive net revenue, each `{ name, qty, revenue }`.

## Acceptance criteria

- An approved owner and a staff member with no permissions receive `7d`. A pending pharmacy is refused with `The dashboard cannot be read.`
- `range=year` is 400 with `The date range is not valid.`
- A sale and a later return land in different buckets. A credit balance uses FIFO. Low stock and an expired batch are counted apart.

## Tests

- `DashboardRulesTest` for net sales, a return in a later month, cash versus credit, gross profit, margin, month purchases and expenses, stock cost and retail, purchase versus sales buckets, expense categories, cash or UPI or card collection, FIFO dues, and low stock versus expiring.
- `DashboardControllerTest` for an owner, a staff member with no permissions, a non-approved account, and a bad `range`.
- `DashboardIT` posts a cash bill, a credit bill, a repayment, a purchase, and an expense, then reads `7d`.
- Bruno `bruno/medmate/dashboard/get-dashboard.bru`.
