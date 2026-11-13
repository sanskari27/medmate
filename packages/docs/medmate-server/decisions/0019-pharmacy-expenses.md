# 0019. Pharmacy expenses

Status: accepted

## Context

An approved pharmacy records out-of-pocket spend and lists it by date, category, and search. Identity already owns the permission catalog. Flyway has used V1 through V19.

## Decision

- Expenses live in a new sibling module, `medmate-server-expenses`. There is no new deployable. Identity does not depend on it. The module depends on identity for `Access.pharmacy` and on shared for paging and `ProblemDetail`.
- `V20__expenses.sql` stores one row per expense for a pharmacy. The next migration in any module is V21 or later.
- The number is `EXP-1001` upward, per pharmacy, from a sequence locked with the pharmacy row. It is not reused.
- Permission keys `expenses:read` and `expenses:create` are added to `PharmacyPermissions`. List and export use read. Create uses create. There is no second catalog.
- Tax is computed from the GST-inclusive amount. It is not stored.

## Consequences

- A later migration must not reuse V20.
- The dispensary dev server already proxies `/pharmacy`, which covers these routes.
- Server-core expense code is not a source for this module.
