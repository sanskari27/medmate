# Manage employees

## Context

An approved pharmacy keeps a personnel register that is separate from the login accounts on Manage Users. The dispensary screen copies the pharmacy Employees page: filters, summary cards, team composition, the table, the form, the ID card, and CSV export. The pharmacy app stays untouched and is not imported. The API is [Pharmacy employees](../../medmate-server/requirements/2026-11-12-pharmacy-employees.md).

## Scope

- An Employees item under Management, before Manage Users, for an approved owner and for pharmacy staff who hold `employees:read`.
- `/employees`.
- Creating and editing a person, uploading a photo and documents, and setting status to Inactive.
- The Manage Users dialog gains the Manage Employees module under Management.

## Non-goals

- A link from an employee to a staff login, a PIN, or a role.
- Payroll payment, attendance, and a delete route.
- Removing an uploaded document.
- The admin portal, the pharmacy app, and Settings or Reports.

## Behavior

The nav label is Employees. The shell title is Employees and the subtitle is `Team records, payroll & bank details`. The item carries the Management heading and sits before Manage Users. An approved owner always sees it. A staff member sees it only with `employees:read`. Create, update, or delete alone leave the item hidden, and `/employees` sends that person to the dashboard. Manage Users, Profile, and Help & Support stay owner-only.

The page loads `GET /pharmacy/employees` through the portal API client. The controls, in order, are the position filter, the status filter, the search field (`Search name, code, phone…`), Export, and Add Employee. Six cards follow: Team size, Monthly payroll, Avg salary, Documents on file, Full-time, and Positions. Team composition follows, then the table: Code, Employee, Position, Phone, Joined, Salary / mo, Docs, Status, and ID card. Search, filters, counts, tenure, and CSV run on the loaded list. CSV columns match the pharmacy export.

Add Employee opens one dialog. The sections are Personal, Employment, Statutory IDs, Documents, Salary bank account, Emergency contact, and Notes. A new person defaults to Pharmacist, Full-time, Active, salary 0, and today's joining date. The code is assigned by the server and is shown on edit. It is not an input. Save stays disabled until the name, phone, and position are present and a typed IFSC is valid.

`employees:create` shows Add Employee. `employees:update` saves every field except a change to Inactive. `employees:delete` is the only way to set Inactive. Switching Inactive back to Active uses update. A person who can update an already inactive record can keep that status. A failed save shows the problem detail on the dialog.

The ID card copies the pharmacy card: orientation, accent, print, and a local logo preview. It reads `workplace` from the employees response. A logo chosen on the card is not saved.

The permission dialog lists Management, then Manage users, Manage Employees, and Help & Support. Manage Employees has Read, Create, Update, and Delete. The keys are `employees:read`, `employees:create`, `employees:update`, and `employees:delete`. The access count is `n / 10`.

## Acceptance criteria

- An owner sees Management, then Employees, then Manage Users. A staff member with `employees:read` sees Employees and does not see Manage Users. A staff member without that key who opens `/employees` lands on the dashboard.
- The dialog has the four employee toggles. Add is absent without create. Save stays disabled until the required fields are valid. Inactive cannot be chosen without delete.
- The server-assigned code is shown on edit and is not typed.

## Tests

- `catalog.test.ts` for the ten keys and the Manage Employees group.
- `EmployeesPage.test.tsx` for the section order, the disabled save, Add hidden without create, and Inactive blocked without delete.
- `AppRouter.test.tsx` for Employees before Manage Users, a staff member with `employees:read`, and a staff member without it sent to the dashboard.
