# Pharmacy staff

## Context

An approved pharmacy owner creates the people who work the counter. Each person signs in with a mobile number and a 4-digit PIN. The owner sets that PIN, replaces it, and disables the account. Permission keys are stored for the management screens that exist today. This does not read the old server-core service.

The dispensary screen is [Manage users](../../dispensary/requirements/2026-11-12-manage-users.md). Sign-in rules stay the ones in [Identity and pharmacy verification](2026-11-11-identity-and-pharmacy-verification.md), narrowed by [0010](../decisions/0010-pharmacy-staff-pin-and-permissions.md).

## Scope

- `GET /pharmacy/staff`, `POST /pharmacy/staff`, and `PATCH /pharmacy/staff/{id}` for an approved pharmacy owner.
- A required PIN on create, and an optional PIN on update. The PIN is stored as a hash.
- A closed permission catalog: `users:read`, `users:create`, `users:update`, `users:delete`, `support:read`, `support:write`.
- PIN login for pharmacy staff who have a PIN.
- Disabling a staff account so that account cannot sign in.

## Non-goals

- Deleting an account, a membership, or a PIN row.
- Returning the PIN in any response.
- Letting staff open Manage Users, Help & Support, or Profile because they hold a key. The keys are stored and returned. A later module spec adds the check for its own actions.
- Staff OTP PIN reset. That stays owner-only.
- A role, a username, a password, a seat count, or a plan.
- A new table, a new Maven module, or anything from server-core.

## Behavior

`GET`, `POST`, and `PATCH` are allowed only for an approved pharmacy owner who is not disabled. Anyone else receives 403 with detail `Only an approved pharmacy owner can manage staff`.

`GET /pharmacy/staff` returns the staff of that pharmacy, ordered by display name, then phone. The owner is not a row. Each row is `id`, `phone`, `displayName`, `accountType`, `pharmacyId`, `subtypes`, `permissions`, `disabled`, and `pinSet`. There is no `pin`.

`POST /pharmacy/staff` takes `{ phone, displayName, pin, permissions }`. The phone is an Indian mobile number. The display name is required and at most 80 characters. The PIN is four digits. Permissions are a subset of the catalog. A missing or invalid PIN is 400 with detail `PIN must be 4 digits`. A key outside the catalog is 400 with detail `Permission key is invalid`. An existing pharmacy account for that phone is 409 with detail `A pharmacy account already exists for this phone`. The response is 201 and does not include the PIN. `pinSet` is true.

`PATCH /pharmacy/staff/{id}` takes any of `displayName`, `phone`, `pin`, `permissions`, and `disabled`. An omitted field stays as stored. A present PIN replaces the hash and is not returned. A blank or invalid PIN is 400 with detail `PIN must be 4 digits`. Phone uses the same checks as create, and 409 when another pharmacy account already has it. A staff account outside this pharmacy, or an owner id, is 404 with detail `Pharmacy staff were not found`. `disabled: true` blocks that account. The bearer filter and refresh already reject a disabled account. PIN login then fails with `PIN was not accepted`.

Login OTP send returns mode `pin` for pharmacy staff who have a PIN, are not disabled, and whose pharmacy is approved. `POST /auth/pin` signs them in. OTP send for `pin_reset` stays refused for staff, with 400 detail `PIN reset is not available`. A disabled staff member cannot sign in with a PIN or an OTP.

The owner still has every pharmacy key without storing them. Keys are not a platform-module grant.

## Acceptance criteria

- An approved owner lists only that pharmacy's staff, creates one with a PIN and `users:read`, and the response has no PIN.
- That staff phone signs in with the PIN and does not receive a login OTP. `support:write` is forbidden. `inventory:read` cannot be saved.
- The owner changes the phone and the PIN without an OTP. The old PIN fails. Staff OTP PIN reset is refused.
- Disabling the account rejects the next PIN login. The row remains in the list.

## Tests

- `AccessTest` for the closed catalog and a granted `users:read`.
- `IdentityFlowIT` for create, PIN login, the rejected key, list, phone and PIN update, refused staff PIN reset, and disable.
- Bruno: `identity/staff/create-pharmacy-staff.bru`, `identity/staff/update-pharmacy-staff.bru`, and `identity/staff/list-pharmacy-staff.bru`. No delete request.

Auth structure is [0010](../decisions/0010-pharmacy-staff-pin-and-permissions.md).
