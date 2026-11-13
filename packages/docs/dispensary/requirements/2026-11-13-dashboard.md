# Dashboard

## Context

An approved pharmacy opens Dashboard to see what the counter, stock, and books did. The screen follows the pharmacy dashboard's order where the stored rows can fill it. The pharmacy app stays untouched and is not imported. The figures come from [Pharmacy dashboard](../../medmate-server/requirements/2026-11-13-pharmacy-dashboard.md).

## Scope

- Dashboard is the first nav item, above Counter, with no section heading.
- `/dashboard` for every signed-in owner and staff member.
- The fixed today and month rail, the stock lists, and the charts driven by one 7-day, 30-day, or 12-month control.

## Non-goals

- A new permission, or a row in Manage Users.
- Links from a card, a row, or a chart to another screen.
- Online orders, a prescription queue, store open or paused, and quick actions. Those facts are not stored.
- The admin portal, the pharmacy app, and unrelated dispensary screens.

## Behavior

Dashboard is the first item in the nav. Billing still carries the Counter heading. The shell title is Dashboard and the subtitle is `Today at a glance`. The nav icon is the existing dashboard glyph. A closed screen still sends the person to `/dashboard`.

The greeting uses the session display name and the Asia/Kolkata hour: Good morning before 12, Good afternoon before 17, otherwise Good evening. A blank name reads `there`. The date line is the Asia/Kolkata weekday, day, and month.

The rail and the cards under it ignore the range control.

- This month is net sales for the current calendar month.
- Average bill today is today's net sales divided by the bills sold today, or zero when there are none.
- Items sold today is the unit count net of returns.
- Dues to collect is the count of credit bills that still have a balance, with the outstanding rupees under it. The cell stays at zero.
- Purchases this month is net purchases for the current calendar month.
- Expenses this month is the GST-inclusive spend for that month.
- Returns today is the stored sale-return amount, with the return count under it.
- Stock at cost is on-hand quantity times batch rate, with retail at MRP under it.
- Today's sales shows net sales, the cash and credit split for today, and a spark of the last 7 days.
- Bills today is the count of bills sold today.
- Stock alerts is the count of products at or under reorder, the count with nothing on hand, and the count of in-stock batches that are expired or expire within 4 months.

Needs your attention lists up to 5 low-stock products, with the quantity on hand and the reorder level. When there are none it says `All clear` and `No pending stock alerts.`

Expiring soon lists up to 5 of those batches. An expired batch says `Expired`. The others say the months remaining and the expiry. When there are none it says `No medicines expiring in the next 4 months.`

Recent bills lists the latest 6 bills: invoice, patient, Cash or Credit, and payable. When there are none it says `No bills yet.`

One control defaults to `7D` and switches `7D`, `30D`, and `12M`. It drives the rest of the page. Changing it asks the server again. The sales chart can switch Revenue or Bills, and Donut, Grouped bars, or Line, without another request. Cash is gold and credit is green. A window with no sales says `No sales in this period.`

Gross profit shows taxable sales, COGS, gross profit, margin, and sale returns for the window. Purchases versus sales is one grouped bar per bucket. Expenses by category lists every category in the window, largest first, or `No expenses recorded in this period.` Cash collected shows Cash, UPI, and Card. Top sellers shows the top 5 names for the window, or `No sales yet in this period.`

Nothing on the page is a link.

## Acceptance criteria

- Dashboard is the first nav button. Counter still labels Billing.
- An owner and a staff member with no other permissions both see the figures for `7D`. Choosing `30D` asks for that range.
- A page with no rows shows the empty copy above. The page has no links.

## Tests

- `DashboardPage.test.tsx` for the fixed figures, a range change, the empty copy, and the absence of links.
- `AppRouter.test.tsx` for Dashboard as the first nav button and Counter on Billing.
