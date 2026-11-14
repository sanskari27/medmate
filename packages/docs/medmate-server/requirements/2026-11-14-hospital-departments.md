# Hospital departments

## Context

An approved hospital records the departments that organize its doctors. A department belongs to one hospital. It may sit under another department in that hospital. A doctor may point at one department. The dispensary screen is [Hospital departments](../../dispensary/requirements/2026-11-14-hospital-departments.md). The doctor directory stays [Hospital doctors](2026-11-14-hospital-doctors.md). The module boundary is [0025](../decisions/0025-hospital-departments.md).

## Scope

- `GET /pharmacy/departments` and `GET /pharmacy/departments/{id}`.
- `POST /pharmacy/departments` and `PATCH /pharmacy/departments/{id}`.
- Permission keys `departments:read`, `departments:create`, and `departments:update` on the closed pharmacy catalog.
- Optional `departmentId` on doctor create and update, and `department` on a doctor response.

## Non-goals

- A delete route, drag-and-drop reorder, and pagination.
- Assigning a doctor to more than one department.
- Clearing a doctor's department when its department is deactivated.
- Reading `server_core`, `app-uploads/server-core/`, or `/medmate-repo/server-core/*`.

## Behavior

Every department route uses `Access.pharmacy` for the caller's pharmacy, then reads the pharmacy row. An approved owner of a hospital is allowed. A staff member of a hospital needs the key named below. A caller whose pharmacy type is not `hospital` receives 403 with detail `Departments are only available for a hospital`, including an owner. Anyone else who fails the permission check receives the detail named below.

`GET /pharmacy/departments` is allowed for `departments:read`, and also for `doctors:create` or `doctors:update`, so the doctor form can load choices. When none of those keys is held, the detail is `Departments cannot be read`.

`departments:read` is required for `GET /pharmacy/departments/{id}`. The detail is `Departments cannot be read`.

`departments:create` is required to create. The detail is `Departments cannot be created`.

`departments:update` is required for any change, including the parent, the active flag, and the display order. The detail is `Departments cannot be updated`.

`GET /pharmacy/departments` returns that pharmacy's departments ordered by display order, then name, then code, ignoring case. The response is the full list. There is no `page` or `size`.

`GET /pharmacy/departments/{id}` returns one `department`. An id outside this pharmacy is 404 with detail `Department was not found`.

Each department is `id`, `name`, `code`, `description`, `isActive`, `displayOrder`, and `parent`. `parent` is null or `{ id, name, code }`. `id` is a server UUID. A client-sent id on create is ignored.

`name` is required, trimmed, and at most 100 characters. `code` is required, trimmed, at most 30 characters, and unique for that pharmacy ignoring case. It can change on update. A duplicate returns 409 with detail `Department code is already in use`.

`description` is optional. Blank text is stored as null. Longer than 4000 characters is refused. `isActive` is a boolean. Omitted on create, it is true. `displayOrder` is a whole number, 0 or greater. Omitted on create, it is 0. Duplicates are allowed.

`parent` is optional. It may be any other department in this pharmacy, including an inactive one. A parent outside this pharmacy is 400 with detail `Parent department was not found`. A self-parent, or a parent that is a descendant, is 400 with detail `Department cycle is not allowed`. Depth is otherwise unlimited. Deactivating a department does not change its children or the doctors linked to it.

On update, an omitted field stays as stored. JSON `null` clears `parent` and `description`. A present blank description clears it.

Create and update of a doctor, JSON and multipart, accept optional `departmentId`. Omitted on create stores null. Omitted on update keeps the current link. `null` or a blank value clears it. A doctor response adds `department`, which is null or `{ id, name, code, isActive }`.

A newly chosen department must be active and in this pharmacy. An unknown id is 400 with detail `Department was not found`. An inactive department that is not the doctor's current department is 400 with detail `Department is inactive`. Saving the doctor's current inactive department is allowed.

| Status | Detail |
| --- | --- |
| 400 | `Department name is required` |
| 400 | `Department name is too long` |
| 400 | `Department code is required` |
| 400 | `Department code is too long` |
| 400 | `Description is too long` |
| 400 | `Display order is invalid` |
| 400 | `Active flag is not recognised` |
| 400 | `Parent department was not found` |
| 400 | `Department cycle is not allowed` |
| 400 | `Department was not found` |
| 400 | `Department is inactive` |
| 403 | `Departments are only available for a hospital` |
| 403 | `Departments cannot be read` |
| 403 | `Departments cannot be created` |
| 403 | `Departments cannot be updated` |
| 404 | `Department was not found` |
| 409 | `Department code is already in use` |

Create responds 201. Update and the reads respond 200.

## Acceptance criteria

- A hospital owner creates a department under an inactive parent, then changes the code.
- A second department with the same code, ignoring case, is 409 and is not stored.
- A parent that is the department itself, or one of its descendants, is 400 and the row is unchanged.
- A retail pharmacy owner receives 403 `Departments are only available for a hospital`.
- A hospital staff member with only `departments:read` can list departments and cannot create one.
- A hospital staff member with `doctors:update` and without `departments:read` can list departments and cannot create one.
- A doctor can be saved with no department, with an active department, and again while keeping a current inactive department. A newly chosen inactive department is refused and the previous link stays.

## Tests

- `DepartmentRulesTest` for the required set, the code and name lengths, the description cap, display order, and cycle detection.
- `DepartmentsFlowIT` for a hospital create under an inactive parent, a code change, a duplicate code, a cycle, a retail 403, and a staff member missing `departments:create`.
- `DoctorsFlowIT` for an optional department, a rejected inactive assignment, a kept current inactive department, and a staff member with `doctors:update` who can list departments and cannot create one.
- Bruno: `departments/list-departments.bru`, `departments/create-department.bru`, and `departments/update-department.bru`.

The module and the two migrations are [0025](../decisions/0025-hospital-departments.md).
