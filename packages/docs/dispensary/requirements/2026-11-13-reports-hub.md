# Reports hub

## Context

An approved pharmacy opens Reports and searches the named reports the pharmacy app lists. The screen follows that hub's layout. Opening a report is [Report detail](2026-11-13-report-detail.md). The pharmacy app stays untouched and is not imported. Staff keys are [Pharmacy report permissions](../../medmate-server/requirements/2026-11-13-pharmacy-report-permissions.md).

## Scope

- A Business item, Reports, immediately after Expenses, for an approved owner and for pharmacy staff who hold `reports:read`.
- `/reports`.
- The filter chips, search, five columns, and a link from each name to its report.
- The Manage Users dialog gains the Reports module under Business, after Expenses.

## Non-goals

- The report table, period, and download. Those are [Report detail](2026-11-13-report-detail.md).
- CA sharing.
- Balance Sheet, GST Sales (With HSN), GST Purchase (With HSN), HSN Wise Sales Summary, TDS Payable, TDS Receivable, TCS Payable, and TCS Receivable. Those amounts are not stored.
- The admin portal, the pharmacy app, and unrelated dispensary screens.

## Behavior

Reports sits under Business, immediately after Expenses and before Employees. Expenses keeps the Business heading when it is visible. When Expenses is hidden and Reports is visible, Reports carries the heading. An approved owner always sees Reports. A staff member sees it only with `reports:read`. Export alone leaves the item hidden, and `/reports` sends that person to the dashboard.

The shell title is Reports and the subtitle is `Sales & GST summary`. The nav icon is the existing reports glyph.

The toolbar follows the pharmacy order. The label `Filter by` comes first, then Party, Category, Payment Collection, Item, Invoice Details, and Summary. A selected chip toggles off on a second click. The search placeholder is `Find report…`. Search matches the report name or description, ignoring case, and combines with the active chip. Both run in the browser.

The columns are Favourite, GST, Transaction, Item, and Party, in a grid of three, then two, then one. A favourite is starred and is listed only under Favourite. An empty column says `No matches`.

Favourite is GSTR-1 (Sales), Profit And Loss Report, and Sales Summary. GST is GSTR-2 (Purchase) and GSTR-3b. Transaction is Audit Trail, Bill Wise Profit, Cash and Bank Report (All Payments), Daybook, Expense Category Report, Expense Transaction Report, and Purchase Summary. Item is Item Report By Party, Item Sales and Purchase Summary, Low Stock Summary, Rate List, Stock Detail Report, and Stock Summary. Party is Receivable Ageing Report, Party Report By Item, Party Statement (Ledger), Party Wise Outstanding, and Sales Summary - Category Wise.

Party keeps the Party column. Category keeps a name containing "categor" and the Item column. Payment Collection keeps Cash and Bank, Receivable Ageing, Party Wise Outstanding, and Party Statement. Item keeps the Item column. Invoice Details keeps Audit Trail, Bill Wise Profit, GSTR-1, Sales Summary, and Purchase Summary. Summary keeps a name containing "summary" and every favourite.

Each name links to `/reports/{id}`. The link target is specified in [Report detail](2026-11-13-report-detail.md).

The permission dialog lists Reports after Expenses. Reports has Read and Export. The keys are `reports:read` and `reports:export`. The access count is `n / 41`. Export can be saved. It does not open the page and does not show a download.

## Acceptance criteria

- An owner sees Expenses, then Reports, under one Business heading, then Employees under Management. A staff member with `reports:read` sees Reports. A staff member with only `reports:export` who opens `/reports` lands on the dashboard. When Expenses is hidden, Reports carries Business.
- Search and each filter hide the other names. An empty column says `No matches`. GSTR-1 links to `/reports/gstr1`.
- The Manage Users dialog includes Reports Read and Reports Export. The access count uses 41.

## Tests

- `catalog.test.ts` in the reports feature for the names, the favourites, and each filter.
- `ReportsPage.test.tsx` for search, `No matches`, and the link to `/reports/gstr1`.
- `model.test.ts` for `reports:read` opening the page and `reports:export` leaving it closed.
- `features/users/catalog.test.ts` for Reports after Expenses and the forty-one keys.
- `UsersPage.test.tsx` for `n / 41` and the Reports rows.
- `AppRouter.test.tsx` for Reports after Expenses, the Business heading on Expenses when both are visible, a staff member with `reports:read`, and a staff member without it sent from `/reports` to the dashboard.
