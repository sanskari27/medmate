# 0010. Pharmacy staff PIN and permission catalog

Status: accepted

## Context

Pharmacy staff were created with a phone and an open set of `module:action` keys, then signed in with an OTP. The owner now sets a 4-digit PIN and records keys for the management screens that exist. Later modules will add their own actions, and an action name will not always be read, create, update, or delete.

## Decision

- A pharmacy staff account with a PIN signs in with that PIN once the pharmacy is approved and the account is not disabled. Login OTP send returns mode `pin` and does not send a code.
- OTP PIN reset stays limited to a pharmacy owner who already has a PIN and is not disabled. Staff cannot reset their own PIN with an OTP. The owner replaces a staff PIN through `PATCH /pharmacy/staff/{id}`.
- Pharmacy permission keys are the closed catalog in `PharmacyPermissions`. The first keys are `users:read`, `users:create`, `users:update`, `users:delete`, `support:read`, and `support:write`. A key outside the catalog is rejected. The owner still passes every pharmacy access check without stored keys.
- A later module adds its keys to that catalog and names the area, module, and actions in its requirement. The dispensary permission dialog groups those keys. The group headings are not part of the stored key.
- No new table. The existing `pin_credential` and `pharmacy_permission` rows are enough. No new Maven module.

## Consequences

- Staff created before this change, with no PIN, still use OTP login.
- `inventory:read` is no longer a valid pharmacy staff key.
- Stored keys do not by themselves open Manage Users or Help & Support. The module that enforces an action adds that check.
