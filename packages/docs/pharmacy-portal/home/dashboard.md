# Dashboard

Route `/`. The dashboard is the home screen after sign-in. It summarises today and opens other screens. It does not change records.

Opening it requires `dashboard:read`. It is open on every plan. See [Permissions](../access/permissions.md) and [Portal shell](../shell/portal-shell.md).

The figures come from the session. This screen does not call a list endpoint.

## What the user sees

The greeting uses the time of day and the pharmacist name, or the pharmacy name. The date is shown. The store chip says Store open or Store paused.

The month strip shows this month’s sales, average bill today, and items sold today. When any non-cancelled sale is unpaid, Dues to collect shows that count.

Four shortcuts: New sale, New purchase, Prescriptions, and Reorder. Prescriptions shows the pending count, or All clear. Reorder shows the low-stock count, or Stock healthy.

KPI cards show today’s sales, with the change against yesterday, online and counter totals, new online orders, pending prescriptions, low stock, and items expiring within four months. A seven-day sparkline sits with the sales figures.

Top sellers are the five products by sales value over the last seven days.

Recent sales lists the six newest sales. Recent orders lists online orders that still need action. Pending prescriptions lists waiting prescriptions. Low stock and expiring stock list those medicines.

Sales analytics has windows 7D, 30D, and 12M, metrics revenue and orders, and charts Donut, Grouped bars, and Line. The user can hide a source. A hospital pharmacy sees Online, Counter sale, Ward sale, Emergency sale, and OPD Rx. Any other pharmacy sees Online and Counter sale. Top categories shows the same window. Empty chart copy is “No sales in this window.”

Cancelled sales are left out of the totals.

## Actions

Each control only opens another screen. The destination `read` key decides whether that control is shown.

| Control | Opens |
| --- | --- |
| New sale | Billing / POS |
| New purchase | Purchases |
| Prescriptions, and the pending-prescription rows | Prescriptions |
| Reorder, low stock, and expiring stock | Inventory for the stock rows, Reorder for the shortcut |
| Today’s sales card and recent sales | Sales |
| New online orders and recent orders | Orders |
| Dues to collect | Khata |

Chart window, metric, chart type, and show or hide are local. They use `dashboard:read` and are not saved.

## States

There is no loading panel and no error panel on this screen. Failed session load uses the shell fault banner. Empty analytics copy is above. A KPI that has nothing to count shows zero.

## API

No call of its own. `GET /api/v1/session` has already loaded sales, inventory, and prescriptions.

## Current app

The shortcuts do not check a `read` key. They navigate for every signed-in user. The sales chart draws a trend from the real source mix. It is not a second set of stored figures.

## Related documents

- [Portal shell](../shell/portal-shell.md)
- [Permissions](../access/permissions.md)
