# 0026. Hospital wards

Status: accepted

## Context

A hospital pharmacy keeps in-patient wards, a bed map, and admissions. Identity already owns accounts, the permission catalog, and the pharmacy type. Doctors and departments are separate hospital modules. Flyway has used V1 through V24. [0025](0025-hospital-departments.md) left the next migration at V25 or later.

## Decision

- `medmate-server-wards` is a sibling module. It depends on shared and identity. The app module depends on it. Identity does not depend on it. Wards does not depend on doctors, departments, CRM, or billing.
- Ward and admission tables live in the same Postgres database. Flyway keeps one history for the process. `V25__wards.sql` is already applied, so the capacity model is `V26__ward_capacity.sql`. The next migration in any module is V27 or later.
- JDBC beans and the ward service load on the `local`, `prod`, and `identity-it` profiles, the same gate identity uses. The default profile does not open them, so the health test still starts without a database.
- Permission keys `wards:read`, `wards:create`, `wards:update`, `wards:admit`, `wards:transfer`, and `wards:discharge` are added to `PharmacyPermissions`. The wards module checks them with `Access.pharmacy`, and also refuses the call unless the pharmacy row's type is `hospital`. There is no second catalog.
- A bed is a label derived from the ward code and bed count. The last held labels are not assignable. There is no bed table.

## Consequences

- A later migration must not reuse V25 or V26.
- The dispensary dev server already proxies `/pharmacy`, which covers these routes.
- Server-core ward code is not a source for this module.
