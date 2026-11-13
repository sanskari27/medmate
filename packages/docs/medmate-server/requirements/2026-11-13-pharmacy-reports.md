# Pharmacy reports

## Context

The dispensary screen is [Report detail](../../dispensary/requirements/2026-11-13-report-detail.md). Staff who can read reports open one of the 23 named reports. Staff who can export download that report as CSV. The figures are computed from posted pharmacy rows. This change does not read the old server-core service. The module boundary is [0020](../decisions/0020-pharmacy-reports.md).

## Scope

- `GET /pharmacy/reports/{id}` for an approved owner and for staff who hold `reports:read`.
- `GET /pharmacy/reports/{id}/export` for an approved owner and for staff who hold `reports:export`.
- The 23 report ids already listed on the dispensary hub.

## Non-goals

- A new permission key, table, or Flyway version.
- Balance Sheet, GST Sales (With HSN), GST Purchase (With HSN), HSN Wise Sales Summary, TDS, and TCS.
- IGST, an online channel, COD on a sale, loose stock, and invoice status history.
- A GST-portal JSON file.
- Reading `server_core`, `app-uploads/server-core/`, or `/medmate-repo/server-core/*`.

## Behavior

Dates are Asia/Kolkata calendar dates. `from` and `to` are inclusive. When both are omitted, the range is the current month. A date that does not parse, or a `from` after `to`, is HTTP 400 with detail `The date range is not valid.` An id outside the 23 is HTTP 404 with detail `This report is not available.`

`reports:read` is required to read. Without it the detail is `Reports cannot be read.` `reports:export` is required to export. Without it the detail is `Reports cannot be exported.` Export does not also require read. An approved owner passes both keys.

Money is half-up to paise. A sale `unit_price` is GST-inclusive. The bill extra is shared across lines with a positive net the way a sale return shares it, and the last of those lines takes the remainder. A purchase `rate` is GST-exclusive, and free quantity is not taxed. An expense `amount` is GST-inclusive. CGST and SGST are each half of the tax, and SGST takes the remainder so the two sum to the tax.

A sale contributes its full shared line value on the sale date. A sale return contributes the stored return-line amount and quantity on the return date. A purchase contributes `rate * qty` plus GST on the recorded date. A purchase return contributes the same formula for the returned quantity on the return date. COGS uses the sold batch `rate`. When that batch has no rate, the cost is zero.

The body has `id`, `name`, `description`, `from`, `to`, `label`, `columns`, `rows`, and `totals` and `note` when they exist. A column has `key`, `label`, `money`, and `num`. A money cell is a decimal string. A quantity or count cell is an integer. `label` is `As of today` for Low Stock, Rate List, Stock Detail, Stock Summary, Receivable Ageing, and Party-wise Outstanding. Those six ignore the range. Every other report uses the range. Its label is the from and to dates, or one date when they are the same.

Export returns `text/csv` with the column labels, the rows, and the totals row when the report has one. The file name is the report id.

- **gstr1.** Slabs `0`, `5`, `12`, and `18`, plus any other rate that has a movement. Columns: GST slab, Qty, Taxable, CGST, SGST, Total tax, Total. Empty note: `No outward supplies in this period.`
- **gstr2.** The same columns for purchases. Empty note: `No inward supplies in this period.`
- **gstr3b.** `3.1 Outward taxable supplies` and `4. Eligible ITC (inward)`. The totals label is `Net GST payable` when outward tax is at least inward tax, otherwise `Net GST credit`. The amount is the absolute difference.
- **pnl.** Taxable sales, COGS, Gross profit, Expenses, Net profit. Note: `COGS uses the sold batch rate.`
- **sales-summary.** Cash sales, Credit sales, Total sales, Average bill. Average bill is the total divided by the number of bills sold in the range, or zero when there are none. Note: `{bills} bills · {units} units`.
- **audit-trail.** One row for each bill, sale return, purchase, purchase return, expense, credit repayment, and distributor payment in the range. Columns: Time, Document, Type, Party, Amount, Status. Status is `Cash`, `Credit`, `Return`, `Recorded`, or the payment mode. Newest first. A purchase or distributor payment amount is the stored ledger amount. Empty note: `No documents in this period.`
- **bill-wise-profit.** Bills sold in the range, using the quantity still sold. Columns: Invoice, Date, Party, Sale (ex-GST), COGS, Profit, Margin. Margin is a whole percent. Empty note: `No sales in this period.`
- **cash-bank.** Four rows always: Cash sales, Cash repayments, UPI, Card. UPI and Card are Bank. Columns: Payment mode, Account, Bills, Collected. Cash sales are cash bills net of cash-sale returns in the range.
- **daybook.** One row per day with a bill, sale return, purchase, or purchase return. Purchases are the line totals, not the rounded ledger amount. Columns: Day, Net sales, Purchases, Net cash flow. Empty note: `No activity in this period.`
- **expense-category.** Grouped by category, largest amount first. Columns: Category, Entries, Taxable, GST, Amount. Empty note: `No expenses recorded in this period.`
- **expense-transaction.** Newest first. Columns: Expense no, Date, Paid to, Category, Mode, Amount. The same empty note.
- **purchase-summary.** One posted GRN, at the recorded amounts. Columns: GRN, Date, Supplier, Invoice no, Items, Taxable, GST, Total. Empty note: `No purchases in this period.`
- **item-by-party.** Item, Party, Qty, Value (ex-GST). **party-by-item.** Party, Item, Qty, Value (ex-GST). Empty note: `No sales in this period.`
- **item-sales-purchase.** Item, Sold qty, Sold value, Purch qty, Purch value, In stock. In stock is the quantity on hand today. Empty note: `No item movement in this period.`
- **low-stock.** Products whose units are at or under the reorder level, including zero. Columns: Item, Category, In stock, Reorder level, Rack, Status (`Out of stock` or `Low`). Empty note: `No items at or below reorder level.`
- **rate-list.** Pack, GST, MRP, Sale price, Rack. Sale price is MRP minus the best current offer, and it is not negative. A blank pack, rack, or GST is `—`. Empty note: `No items in stock.`
- **stock-detail.** Batches with quantity above zero. Columns: Item, Batch, Expiry, To expiry (`Expired` or `{n}mo`), Qty, MRP, PTR, Value. Empty note: `No batches in stock.`
- **stock-summary.** Item, Category, In stock, MRP, Stock value, Status. Status is `Out` when nothing is on hand, otherwise `Expired` when the earliest batch still in stock is expired, otherwise `Low` when the product is at or under reorder, otherwise `OK`. Empty note: `No items in stock.`
- **receivable-ageing.** One row per credit bill that still has a balance after FIFO repayments. Columns: Party, Invoice, Outstanding, Age (days), Bucket (`0–30`, `31–60`, `61–90`, `90+`). Empty note: `No outstanding receivables.`
- **party-ledger.** A patient with a bill in the range or a current balance. Columns: Party, Phone, Bills, Total billed, Received, Outstanding. Received is cash-bill net plus repayments in the range. Outstanding is the current khata balance. Empty note: `No party activity in this period.`
- **party-outstanding.** Patients with a current balance above zero. Columns: Party, Phone, Outstanding, Oldest due (days). Empty note: `No party has outstanding dues.`
- **sales-category-wise.** Net sales by `product_type`. A blank type is `—`. Columns: Category, Qty, Taxable, GST, Total. Empty note: `No sales in this period.`

Category on a stock report is `product_type`, or `—` when it is blank. Credit outstanding applies repayments to the oldest credit bill first, after that bill’s returns.

## Acceptance criteria

- `reports:read` returns GSTR-1. `reports:export` returns the CSV. The other key is refused with the details above.
- An unknown id is 404. `from` after `to` is 400.
- A sale and a later return land in different months. A credit balance uses FIFO.

## Tests

- `ReportRulesTest` for slab GST, a return in a later month, GSTR-3B, bill profit, cash versus UPI, daybook, both expense reports, FIFO ageing, and the four stock snapshots.
- `ReportControllerTest` for read, a missing export key, an unknown id, and `from` after `to`.
- `ReportIT` posts a cash bill, a credit bill, a repayment, a purchase, and an expense, then checks GSTR-1, party outstanding, and the CSV.
- Bruno `bruno/medmate/reports/get-report.bru` and `export-report.bru`.
