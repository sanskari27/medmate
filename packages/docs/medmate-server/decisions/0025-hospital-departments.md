# 0025. Hospital departments

Status: accepted

## Context

A hospital pharmacy keeps a department tree that is separate from the doctor directory. A doctor may point at one department. Identity already owns accounts, the permission catalog, and the pharmacy type. Flyway has used V1 through V22. [0024](0024-hospital-doctors.md) left the next migration at V23 or later.

## Decision

- `medmate-server-departments` is a sibling module. It depends on shared and identity. The app module depends on it. Identity does not depend on it. Departments does not depend on doctors.
- `medmate-server-doctors` depends on departments so a doctor save can resolve `departmentId`. The department table is not written by the doctors module.
- Department tables live in the same Postgres database. Flyway keeps one history for the process. The script is `V23__departments.sql`. `V24__doctor_department.sql` adds nullable `doctor.department_id`. The next migration in either module is V25 or later.
- JDBC beans and the department service load on the `local`, `prod`, and `identity-it` profiles, the same gate identity uses. The default profile does not open them, so the health test still starts without a database.
- Permission keys `departments:read`, `departments:create`, and `departments:update` are added to `PharmacyPermissions`. The departments module checks them with `Access.pharmacy`, and also refuses the call unless the pharmacy row's type is `hospital`. `GET /pharmacy/departments` is also allowed for `doctors:create` or `doctors:update`. There is no second catalog.

## Consequences

- A later migration must not reuse V23 or V24.
- The dispensary dev server already proxies `/pharmacy`, which covers these routes.
- Server-core department code is not a source for this module.
