# 0008. Platform phone sign-in

Status: accepted

## Context

The admin portal no longer asks whether a person is a platform admin or a staff subtype. Auth today requires a stored `accountType`, and `(phone, account_type)` is unique, so one phone can be both an admin and a staff member. The portal cannot choose which row to load.

## Decision

- `accountType: "platform"` on OTP send and verify is a login scope. It is not a value stored in `account.account_type`.
- The scope resolves to the single `admin` or `staff` row for that phone. The OTP challenge and the session use that row's real type.
- Zero platform rows, or both an admin row and a staff row, do not reveal which case it is. Send still returns OTP mode and does not send SMS. Verify is rejected.
- A partial unique index on `account(phone)` for `admin` and `staff` makes the single-row case the normal one. Pharmacy, customer, and rider accounts are outside that index.
- Explicit `admin` and `staff` requests stay valid.

## Consequences

- Creating staff for an admin phone, or an admin for a staff phone, conflicts.
- A phone can still be a platform account and a pharmacy, customer, or rider account.
- Later portal work sends `platform` and reads the account type from the session.
