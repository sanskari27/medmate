# Report detail

## Context

An approved pharmacy opens one of the 23 reports from the hub. The screen follows the pharmacy report page: back, period, Excel, PDF, then the title, the period, and the table. The pharmacy app stays untouched and is not imported. The API is [Pharmacy reports](../../medmate-server/requirements/2026-11-13-pharmacy-reports.md). Staff keys stay `reports:read` and `reports:export`.

## Scope

- `/reports/:reportId` for an approved owner and for staff who hold `reports:read`.
- The hub name navigates to that route.
- The period control, the table, Excel, and PDF.

## Non-goals

- A new permission row. The Manage Users dialog already lists Reports Read and Reports Export.
- The four-tab analytics dashboard.
- Balance Sheet, HSN reports, TDS, and TCS.
- The admin portal, the pharmacy app, and unrelated dispensary screens.

## Behavior

The hub keeps its search, filters, and five columns. A report name is a link to `/reports/{id}`. The later-update sentence is gone.

`/reports/:reportId` uses the same access rule as `/reports`. Export alone still lands on the dashboard. An id that is not one of the 23 shows `This report is not available.`

The bar order is `← All reports`, then the period, then Excel and PDF. Excel and PDF render only when the person holds `reports:export`. An owner holds it. Excel downloads the CSV from `GET /pharmacy/reports/{id}/export`. PDF prints the open table and hides the bar. The request goes through the portal API client. No production URL is written in a component.

The period chips are Today, This month, This year, This FY, Custom, and All. This month is the default. This FY runs 1 April through 31 March. All starts on 1 January 2000 and ends today. Custom shows two dates and waits until both are set. Dates are Asia/Kolkata dates. The page sends `from` and `to`.

Low Stock, Rate List, Stock Detail, Stock Summary, Receivable Ageing, and Party-wise Outstanding hide the period chips. Their badge reads `As of today`.

The title is the report name. The badge is the response `label`. Under it is the description, a middle dot, and the row count. Money is right-aligned and shown in rupees. The totals row is a footer. An empty table shows the note. When rows exist, the note sits under the table. A failed request shows the problem detail.

## Acceptance criteria

- The hub links GSTR-1 to `/reports/gstr1` and does not show the later-update sentence.
- GSTR-1 shows a returned row. An empty report shows its note. Low Stock hides the period chips.
- Excel is absent without `reports:export`.
- A staff member without `reports:read` who opens `/reports` or `/reports/gstr1` lands on the dashboard.

## Tests

- `ReportsPage.test.tsx` for the GSTR-1 link and the absent later-update sentence.
- `ReportPage.test.tsx` for a GSTR-1 row, the empty note, a hidden period on Low Stock, and no Excel button without `reports:export`.
- `AppRouter.test.tsx` for a staff member without `reports:read` sent from `/reports` and from `/reports/gstr1` to the dashboard.
- `catalog.test.ts` still lists the 23 names.
