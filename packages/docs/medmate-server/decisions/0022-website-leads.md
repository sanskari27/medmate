# 0022. Website leads

Status: accepted

## Context

Namma MedMate and the pharmacy site collect contact and signup forms. Those rows are not pharmacy support cases and they are not a pharmacy permission. Flyway has used V1 through V20. The public client already calls `POST /api/v1/leads`, and the other medmate-server routes have no `/api/v1` prefix.

## Decision

- Leads live in a new sibling module, `medmate-server-leads`. There is no new deployable. Identity does not depend on it. The module depends on identity for `AccountPrincipal` and on shared for paging and `ProblemDetail`.
- `V21__website_leads.sql` stores one row per submission. The next migration in any module is V22 or later.
- `POST /api/v1/leads` is anonymous. `GET /api/v1/leads`, `GET /api/v1/leads/{id}`, and `PATCH /api/v1/leads/{id}` are allowed for a non-disabled platform admin and for staff whose subtypes include `support`. No key is added to `PharmacyPermissions`.
- The security filter permits `/api/v1/leads` and `/api/v1/leads/**` so a missing session reaches the module. The pharmacy approval gate allows the same paths through. A rejected bearer stays on the existing JWT filter.
- Browser calls are also allowed from `https://medmatepharmacy.com`, `https://www.medmatepharmacy.com`, and `https://*.medmatepharmacy.com`.
- Server-core is not a source for this module.

## Consequences

- A later migration must not reuse V21.
- Other routes stay without the `/api/v1` prefix.
- The admin dev server proxies `/api` to this process.
