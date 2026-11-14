# Hospital departments

## Context

A hospital keeps a department directory that is separate from Doctors, Employees, and Manage Users. A doctor may be set to one department. The section is hidden for a retail pharmacy. The pharmacy app stays untouched and is not imported. The API is [Hospital departments](../../medmate-server/requirements/2026-11-14-hospital-departments.md).

## Scope

- A Departments item in the Hospital section, immediately after Doctors, for an approved hospital owner and for hospital staff who hold `departments:read`.
- `/departments`.
- Creating and editing a department, including an optional parent, display order, and Active or Inactive.
- An optional Department field at the end of the doctor form's Basic section, and a Department column on the doctors table after Code.
- The Manage Users dialog gains Departments under Hospital, after Doctors.

## Non-goals

- Deleting a department, drag-and-drop reorder, and pagination.
- A doctor with more than one department.
- The admin portal, the pharmacy app, and every dispensary screen other than the sidebar, this page, the doctor form and table, and Manage Users.

## Behavior

The nav label is Departments. The shell title is Departments and the subtitle is `Names, codes and hierarchy`. The item sits under Hospital, immediately after Doctors. An approved owner of a pharmacy whose `pharmacyType` is `hospital` always sees it. Hospital staff see it only with `departments:read`. Create or update alone, and `doctors:create` or `doctors:update` alone, leave the item hidden. A retail pharmacy, and a hospital staff member without `departments:read` who opens `/departments`, land on the dashboard.

The page loads `GET /pharmacy/departments` through the portal API client. The controls, in order, are the status filter (All, Active, Inactive), the search field (`Search name or code…`), and Add department. The table follows: Name, Code, Parent, Order, and Status. The Parent cell shows the parent name, or an em dash when there is none. Search matches name, code, and parent name, ignoring case. The status filter runs on the loaded list. Empty copy is `No departments yet.` A search or filter with no row shows `No departments match your search.`

Add department and Edit open the form on the same page. The fields, in order, are Name, Code, Description, Parent, Display order, and Active. A new department defaults to Active, display order 0, and no parent. The server id is not shown. Parent choices are every other department except the department itself and its descendants, including inactive departments, labeled `name (code)`, plus No parent. Save stays disabled until the name and code are present and the display order is a whole number, 0 or greater.

`departments:create` shows Add department. `departments:update` opens Edit and saves the form. A failed save shows the problem detail on the form.

The doctor form loads the same department list. The Department select sits at the end of Basic. Choices are the active departments, plus the doctor's current department when that department is inactive, labeled `name (code)`, plus No department. The doctors table shows that department's name after Code, or an em dash when the doctor has none. The doctors feature imports the list hook from the departments feature's `index.ts`.

The permission dialog lists Counter, then Hospital, then Management. Under Hospital, Doctors stays first and Departments follows, with Read, Create, and Update. The keys are `departments:read`, `departments:create`, and `departments:update`. The access count is `n / 47`. The rows are shown for every pharmacy.

## Acceptance criteria

- A hospital owner sees Doctors, then Departments, under Hospital. A retail owner does not see Hospital. A hospital staff member with `departments:read` sees Departments. A hospital staff member without that key who opens `/departments` lands on the dashboard.
- The dialog has the three department toggles under Hospital, after Doctors. Add is absent without create. Edit is absent without update. Save stays disabled until the name, code, and display order are valid.
- The parent select omits the department itself and its descendants. The doctor form can leave Department empty, and an inactive current department stays in the choices.

## Tests

- `model.test.ts` for the draft, the search filter, and parent choices that drop self and descendants.
- `DepartmentsPage.test.tsx` for the columns, Add hidden without `departments:create`, and edit hidden without `departments:update`.
- `catalog.test.ts` and `UsersPage.test.tsx` for Departments after Doctors and `n / 47`.
- `AppRouter.test.tsx` for Departments after Doctors, a retail pharmacy, and a hospital staff member without `departments:read` sent from `/departments` to the dashboard.
- A doctor form test for the optional select and for keeping an inactive current department in the choices.
