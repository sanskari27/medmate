# Billing page split

## Context

The dispensary counter and its posted invoice live in one component. Print hides every node that is not `.print-area`. The posted invoice does not carry that class, so the printed page is blank. The invoice sample on Invoice Settings already uses the class. The pharmacy app stays untouched and is not imported.

## Scope

- Split the billing page into search, the cart, settlement, and the posted invoice.
- Move line figures, bill totals, and the rupee, batch, and composition formatters into a view util beside the page.
- Print on the posted invoice prints that bill.

## Non-goals

- Changing cart math, charge, keyboard shortcuts, pay modes, or the invoice sample layout.
- Rack labels, staff ID cards, the admin portal, and the pharmacy app.
- A bill list or reprint from a list.

## Behavior

The counter looks and works as it does today: search, the line grid, the settlement dock, and Charge. After a successful charge, the invoice from Invoice Settings opens over the counter. Its root has `print-area` for every template, and the title bar and buttons are hidden in print. Print shows that bill and hides the counter. Esc or New bill still closes the dialog and clears the sale.

## Acceptance criteria

- Search, the cart, settlement, and Charge behave as before. Charge stays hidden without `billing:create`.
- After charge, the invoice dialog shows the bill number, and the invoice root has `print-area`.
- A sellable line with a percent offer and a flat bill discount reports gross, offer discount, CGST, SGST, and payable from the view util.

## Tests

- `billingView.test.ts` for one sellable line with a percent offer and a flat bill discount.
- `BillingPage.test.tsx` for the posted invoice root carrying `print-area` and the bill number.
