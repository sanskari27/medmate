# 0029. Clinic accounts

Status: accepted

## Context

`AccountType` holds `ADMIN`, `PHARMACY`, `CUSTOMER`, `RIDER` and `STAFF`. The
doctor portal needs a sixth kind of account: a person who works in a clinic.
A clinic is a tenant, and it has roles of its own that do not map onto
`PharmacyRole` or `StaffSubtype`.

The identity module already owns the OTP, PIN and session flows, and both
existing portals sign in against it. A second identity system would mean two
places where a staff member exists and two places where an account can be
disabled.

## Decision

- `CLINIC` joins `AccountType` and its wire value is `clinic`.
- A clinic account carries a `clinicId` and a `clinicRole`.
- `ClinicRole` is one of `OWNER`, `DOCTOR`, `NURSE`, `FRONT_DESK`, `ADMIN`.
- `AccountPrincipal` gains `clinicId` and `clinicRole`. Both are null for every
  other account type.
- `AccountResponse` gains the same two fields, so a portal reads the role it
  was issued.
- The grant keys a clinic account can hold are namespaced `clinic:module:action`.
  `PharmacyPermissions` already holds `patients:read`, which means something
  different there, so the clinic keys cannot reuse the bare string.
- The grants themselves are per-account and live in the clinic's own database,
  owned by the clinic service. `medmate-server` holds the role, not the grants.
  The clinic owner changes them for their staff in a later requirement.
- The clinic portal signs in with the existing `/auth` routes and
  `accountType: "clinic"`. No new auth route is added.
- A phone resolves to at most one clinic account, the same way it resolves to
  at most one pharmacy account.

## Consequences

- `AccountType` and `AccountPrincipal` change, so the identity module, its
  store and the auth controller all change. The pharmacy, admin and public
  behaviour is unchanged.
- A clinic account cannot be created by a phone number that already holds a
  pharmacy or platform account. Which account type a phone holds is decided
  when it is created, not at sign-in.
- Clinic staff are disabled through the identity module like every other
  account. The doctor portal does not own staff lifecycle.
- A clinic account's grants are read by the clinic service from the clinic's
  own database, so granting and revoking takes effect on the next request
  without a token being reissued.
- `medmate-server` stays free of clinic records. It knows which clinic an
  account belongs to and which role it has there, and nothing else.
