# Manage users

## Context

The dispensary shell is the pharmacy owner's console. Manage Users is the first Management item, before Help & Support and Profile. The screen follows the pharmacy users page: summary cards, then the staff table, then one dialog for details and permissions. The pharmacy app stays untouched and is not imported. The API is [Pharmacy staff](../../medmate-server/requirements/2026-11-12-pharmacy-staff.md).

## Scope

- A Manage Users item under Management for an approved pharmacy owner.
- `/users`.
- Creating and editing staff, setting a PIN, choosing the six management permission keys, and disabling an account.

## Non-goals

- A role field, role column, username, password, or reveal of a stored PIN.
- Seat, plan, and Access roles cards.
- Permanent delete.
- Profile permission toggles.
- Letting a staff member open this screen, Help & Support, or Profile.
- The admin portal, the pharmacy app, and Settings or Reports.

## Behavior

The nav item is visible only when `pharmacyRole` is `owner`. It carries the Management heading. Profile follows it, then Help & Support. Dashboard, Settings, and Reports stay above the section. Pharmacy staff have no item. `/users` sends staff to `/dashboard`.

The shell title is Manage Users. The subtitle is `Staff & access`.

The page loads `GET /pharmacy/staff` through the portal API client. Two cards sit above the table: Team members, with the active count, and Login enabled, with the count of accounts that have a PIN. The table heading is Staff & access control, with Add user.

Columns are Member, Login, Access, Status, and the actions. Member is the display name. Login is the phone. Access is `n / 6`. Status is a switch that enables and disables. The trash control sets disabled and leaves the row. There is no role column.

Add user and the row edit control open one dialog. Details are on top: display name, mobile number, and a 4-digit PIN. Permissions follow, under the heading Permissions:

- Management
  - Manage users: Read, Create, Update, Delete
  - Help & Support: Read, Write

Select all and Clear act on those six toggles. There is no Reset to Cashier defaults and no Save & share. Create requires the name, phone, and PIN. Edit can change the name and phone. A blank PIN on edit keeps the current one. Cancel closes the dialog.

After a successful create, or an edit that sent a new PIN, the dialog shows that PIN once with Copy PIN. The value comes from what the owner typed. The API does not return it.

A failed save shows the problem detail on the dialog.

The Staff login tab opens the existing PIN step when send returns mode `pin`. The owner tab stays on that step. The existing role check still rejects the wrong tab after PIN login.

## Acceptance criteria

- An owner sees Management, then Manage Users, Profile, and Help & Support. Staff do not, and staff opening `/users` land on the dashboard.
- The dialog has the six permission toggles and no role field. Create shows the typed PIN once.
- The trash control disables the row and leaves it in the table.
- The Staff tab reaches the PIN step when login uses a PIN.

## Tests

- `catalog.test.ts` for the six keys, the Management groups, and the access count.
- `UsersPage.test.tsx` for the missing role field, the permission groups, disable from the trash control, and the one-time PIN.
- `AppRouter.test.tsx` for the owner nav order, the staff redirect, and the Staff tab PIN step.
