# Platform sign-in

## Context

Admin and platform staff sign in with OTP. The client used to send `accountType: "admin"` or `accountType: "staff"`, and the same phone could hold both. The admin portal no longer asks which one the person is. The server has to find the single platform account for that phone. Pharmacy, customer, and rider accounts are unchanged. This does not read the old server-core database.

## Scope

- `POST /auth/otp/send` and `POST /auth/otp/verify` when `accountType` is `platform`.
- A uniqueness rule so one phone is at most one of `admin` or `staff`.
- `POST /staff` and `POST /auth/admin-bootstrap` rejecting the other platform type for that phone.

## Non-goals

- Pharmacy, customer, or rider login, signup, or PIN behavior.
- PIN login for admin or staff.
- Removing explicit `accountType: "admin"` and `accountType: "staff"` on send and verify.
- Making a platform phone unique against a pharmacy, customer, or rider account.
- A portal UI. The admin spec covers that.

## Behavior

`accountType: "platform"` is a login scope. It is not stored on an account. See `decisions/0008-platform-phone-sign-in.md`.

Send and verify with `platform` look up `admin` and `staff` rows for that phone.

- Exactly one row: the OTP is stored and checked under that row's real type, `admin` or `staff`. Verify issues that account's session, including its subtypes.
- No platform row, only a pharmacy, customer, or rider row, or both an admin row and a staff row: send returns `{ "mode": "otp" }` and does not send SMS. Verify is 401 with detail "Code was not accepted".
- `purpose: "signup"` or `purpose: "pin_reset"` with `platform` is 400.
- `POST /auth/pin` with `platform` is 401.

Explicit `admin` and `staff` on send and verify stay as they are.

A partial unique index on `account(phone)` where `account_type` is `admin` or `staff` rejects a second platform row for the same phone. Pharmacy, customer, and rider may still share that phone.

`POST /staff` returns 409 "A platform admin already exists for this phone" when the phone is already an admin. The existing staff conflict, "A staff account already exists for this phone", stays.

`POST /auth/admin-bootstrap` returns 409 "A staff account already exists for this phone" when the phone is already staff and is not already an admin. An existing admin still returns `created: false`.

## Acceptance criteria

- A platform send and verify for one staff phone returns that staff account, with its `accountType` and subtypes.
- A platform send for an unknown phone does not send SMS, and verify is 401 "Code was not accepted".
- Creating staff for an admin phone, and bootstrapping an admin for a staff phone, are 409.
- A pharmacy login with `accountType: "pharmacy"` is unchanged.

## Tests

- A plain resolver unit test: one admin, one staff, a pharmacy-only phone, and both an admin and a staff row.
- Staff create and bootstrap conflict cases.
- `IdentityFlowIT`: platform verify returns the real `accountType` and subtypes; an unknown platform phone is 401.
- Bruno requests `bruno/medmate/identity/auth/send-otp-platform.bru` and `verify-otp-platform.bru`.
