# Distributors

## Context

An approved pharmacy keeps a directory of the firms that supply medicine. The dispensary screen copies the pharmacy distributor directory: summary cards, search, the table, and the add/edit dialog. It leaves out the three tabs, the Products sourced card, and the Products column. A large statement modal lists the distributor's ledger. The pharmacy app stays untouched and is not imported. The API is [Pharmacy distributors](../../medmate-server/requirements/2026-11-12-pharmacy-distributors.md).

## Scope

- A Catalogue heading after Dashboard, with one item, Distributors, for an approved owner and for pharmacy staff who hold `distributors:read`.
- `/distributors`.
- Creating and editing a distributor, setting Active or Inactive, and recording a payment from the statement.
- The Manage Users dialog gains the Catalogue area and the Distributors module.

## Non-goals

- Inventory, Rack & Locations, Purchases, Offers, Supply list, and Price compare.
- Recording a purchase bill or a return from this screen.
- A delete route.
- The admin portal and the pharmacy app.

## Behavior

The nav label is Distributors. The shell title is Distributors and the subtitle is `Your distributor & supplier directory`. The item carries the Catalogue heading and sits immediately after Dashboard. An approved owner always sees it. A staff member sees it only with `distributors:read`. Create, update, delete, or pay alone leave the item hidden, and `/distributors` sends that person to the dashboard.

The page loads `GET /pharmacy/distributors` through the portal API client. The controls, in order, are the Distributor directory heading, the search field (`Search name, GSTIN, contact…`), and Add distributor. Three cards follow: Distributors (`n active`), Total outstanding (`payable to distributors`), and On credit terms (`credit accounts`). A credit account is a distributor whose payment terms contain "credit". The table follows: Distributor, Contact, GSTIN / DL No., Payment terms, Outstanding, Status, and the row actions. Search matches name, GSTIN, phone, contact person, city, and email on the loaded list. A positive outstanding uses the pharmacy red.

Add distributor opens one dialog. The sections are Basic information, Legal & registration, Address, Financial information, and Status & availability. A new distributor defaults to `30 days credit`, Active, shown in purchases and reorder lists, and an opening balance of 0. State starts blank. The code is assigned by the server and is shown on edit. It is not an input. Save stays disabled until the name and phone are present. A typed GSTIN that fails the pharmacy check shows `Enter a valid GSTIN` and is not sent.

`distributors:create` shows Add distributor. `distributors:update` saves every field except a change to Inactive. `distributors:delete` is the only way to set Inactive. Switching Inactive back to Active uses update. A person who can update an already inactive record can keep that status. The outstanding input edits the opening balance. It is disabled once any ledger line exists, and it still shows that opening amount. A failed save shows the problem detail on the dialog.

Each row has a Transactions button. It opens one statement dialog, 960px wide and up to 90vh tall. The dialog shows Opening, Purchases, Payments, Returns, and Outstanding, then a table from oldest to newest: Date, Type, Reference, Details, Amount, and Balance. The first row is the opening balance. Later rows are Purchase bill, Payment, and Return. A bill increases the running balance. A payment or a return decreases it. `distributors:pay` shows Record payment in that dialog: amount, mode (Cash, UPI, Card, Bank transfer), and an optional note. Record stays disabled when the outstanding is zero, the amount is zero, or the amount is above what is still owed. Read-only staff see the statement and no record form.

The permission dialog lists Management, then Catalogue. Distributors has Read, Create, Update, Delete, and Pay. The keys are `distributors:read`, `distributors:create`, `distributors:update`, `distributors:delete`, and `distributors:pay`. The access count is `n / 17`.

## Acceptance criteria

- An owner sees Catalogue, then Distributors, immediately after Dashboard. A staff member with `distributors:read` sees Distributors and does not see Manage Users. A staff member without that key who opens `/distributors` lands on the dashboard.
- The dialog has the five distributor toggles. Add is absent without create. Save stays disabled until the name and phone are present. Inactive cannot be chosen without delete.
- The statement lists a purchase bill, a payment, and a return. The record form is absent without pay. The opening balance cannot be edited once a ledger line exists.

## Tests

- `catalog.test.ts` for Catalogue after Management and the seventeen keys.
- `DistributorsPage.test.tsx` for the section order, no Products column and no tabs, the disabled save, Add hidden without create, Inactive blocked without delete, the opening balance locked once a ledger line exists, the statement lines, and the record form hidden without pay.
- `AppRouter.test.tsx` for Catalogue after Dashboard, a staff member with `distributors:read`, and a staff member without it sent to the dashboard.
