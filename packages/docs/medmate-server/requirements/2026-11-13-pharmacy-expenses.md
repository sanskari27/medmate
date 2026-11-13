# Pharmacy expenses

## Context

An approved pharmacy records out-of-pocket spend: rent, salaries, utilities, and the like. The dispensary screen is [Expenses](../../dispensary/requirements/2026-11-13-expenses.md). The module boundary is [0019](../decisions/0019-pharmacy-expenses.md). This does not read the old server-core service.

## Scope

- A new `medmate-server-expenses` module and `V20__expenses.sql`.
- `GET /pharmacy/expenses`, `GET /pharmacy/expenses/export`, and `POST /pharmacy/expenses`.
- Permission keys `expenses:read` and `expenses:create` on the closed pharmacy catalog.

## Non-goals

- Editing or deleting an expense, and a separate category route.
- Credit or insurance as a payment mode.
- A Reports route, an expense-category report, or an expense-transaction report from the server.
- A new permission beyond `expenses:read` and `expenses:create`. Excel and PDF use the export route and `expenses:read`.
- Reading `server_core`, `app-uploads/server-core/`, or `/medmate-repo/server-core/*`.

## Behavior

Every expenses route uses `Access.pharmacy` for the caller's pharmacy. An approved owner is allowed. A staff member needs the key named below. Anyone else receives 403.

`expenses:read` lists expenses and calls export. The detail is `Expenses cannot be read`. It does not create.

`expenses:create` saves an expense. The detail is `Expenses cannot be created`. `expenses:read` does not create. Create does not require read.

`GET /pharmacy/expenses` uses the shared page parser. A bad page is `Page is not valid`. Rows are `spentOn` descending, then `number` descending. `from` and `to` are inclusive `YYYY-MM-DD` dates. Omitting both means the last 365 Asia/Kolkata calendar dates, ending today. Sending only one, a value that is not a date, or a `from` after `to` is 400 `Date range is not valid`. `category` omitted, blank, or `all` does not filter. Any other `category` keeps rows whose stored category equals that string. `q` is a case-insensitive substring of the number, party, category, or note. A blank `q` does not filter.

The response is `expenses`, `summary`, `categories`, `page`, `size`, and `total`. A row is `number`, `spentOn`, `party`, `category`, `paymentMode`, `amount`, `gst`, and `note`. `amount` is a decimal string with two places. `gst` is a whole number. `note` is null when blank. `summary` ignores `page` and `size` and follows `from`, `to`, `category`, and `q`. It is `count`, `total`, and `gst`. `count` equals `total`. `summary.total` is the sum of amounts. `summary.gst` is the sum of each row's tax. Taxable value is the amount divided by `1 + gst/100`, half-up to two places. Tax is the amount minus that taxable value. A zero `gst` has tax `0.00`. `categories` ignores the filters and the page. It is the fixed names below, in this order, then each custom category this pharmacy has saved, in the order it was first saved. A custom string that equals a fixed name is not repeated.

The fixed names are Employee Salaries & Advances, Rent Expense, Electricity Bill, Telephone & Internet Expense, Printing and Stationery, Repair & Maintenance, Transportation & Travel, Raw Material, Marketing & Promotion, Bank Charges, and Miscellaneous.

`GET /pharmacy/expenses/export` uses the same `from`, `to`, `category`, and `q` rules and the same order. It ignores `page` and `size`. The response is `expenses`, every matching row. An empty filter returns an empty list.

`POST /pharmacy/expenses` returns 201 with `expense`. The body is `spentOn`, `party`, `category`, `paymentMode`, `amount`, `gst`, and an optional `note`. `paymentMode` is `cash`, `upi`, `card`, or `cod`. `gst` is 0, 5, 12, 18, or 28. `amount` is positive and has at most two decimal places. `party` and `category` are trimmed and are 1 through 120 and 1 through 80 characters. A blank note is stored as null. A note longer than 500 characters is rejected. `spentOn` cannot be after today in Asia/Kolkata. Anything else is 400 `Expense is not valid` and stores nothing. The number is `EXP-1001` for the pharmacy's first expense, then `EXP-1002`, and is not reused. A category that is not a fixed name is a custom category for that pharmacy.

Another pharmacy's rows are absent from the list and the export. Its next number starts again at `EXP-1001`.

| Status | Detail |
| --- | --- |
| 400 | `Page is not valid` |
| 400 | `Date range is not valid` |
| 400 | `Expense is not valid` |
| 403 | `Expenses cannot be read` |
| 403 | `Expenses cannot be created` |

## Acceptance criteria

- A staff member with `expenses:read` can list and export and cannot create. A staff member with `expenses:create` can create and cannot list. An owner can do both.
- Page 1 of 30 matching expenses returns 25 rows and `total` 30. `summary.count` is 30. Page 2 returns the other 5. A category or `q` that excludes a row changes `summary` and leaves `categories` complete.
- The first saved expense is `EXP-1001`. A second pharmacy's first expense is also `EXP-1001`. Amount `118.00` at 18 percent has tax `18.00`. A future date stores nothing.
- Export returns the matching rows from both pages. `size=101` and a reversed date range are 400.

## Tests

- `ExpenseRulesTest` for the tax split, the fixed category order, a custom category kept once, the number sequence, and a rejected future date.
- `ExpenseControllerTest` for the read and create gates.
- `ExpenseIT` for the next page, a summary that ignores the page, pharmacy isolation, and an export of both pages.
- `AccessTest` for `expenses:read` and `expenses:create`.
- Bruno requests `expenses/list-expenses.bru`, `expenses/create-expense.bru`, and `expenses/export-expenses.bru`.
