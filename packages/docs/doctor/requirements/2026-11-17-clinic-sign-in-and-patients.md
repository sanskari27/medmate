# Clinic sign-in and patient list

## Context

MedMate Doctor is the clinic dashboard for a doctor's practice: the owner, the
doctors, the nurses, the front desk and the clinic admin. Today it exists as a
separate Next.js app on Netlify at `medmate-doctor-clinic.netlify.app`, and it
is not part of this repository.

Clinic records - patients, visits, prescriptions, invoices - do not exist in
`medmate-server`, which is a pharmacy CRM. The pharmacy CRM's patients, stock
and billing are a different domain and are not reused.

A clinic is a tenant. Each clinic gets its own database on the shared Postgres
instance, the same way each application in this platform gets its own database.
Identity stays in one place: `medmate-server` owns accounts, and a clinic staff
member signs in with the same `/auth` routes the dispensary and the admin use,
with `accountType: "clinic"`.

This requirement is the first slice. It proves the whole spine - identity,
tenant routing, per-clinic database, and the portal - and lands on the role
landing screen and the patient list. The queue, the consultation, the
prescription, billing and the kiosk follow as later requirements.

## Scope

- A new doctor portal, `packages/apps/doctor`, on the stack the other portals
  use: TypeScript, Vite, React 19, Tailwind v4, React Router, Redux Toolkit,
  RTK Query, React Hook Form, Zod, Vitest, Testing Library.
- A new clinic API service, `packages/apps/medmate-clinic-api`, on Java 21 and
  Spring Boot 3.5.6, with its own database per clinic.
- `CLINIC` as an account type in `medmate-server` identity, using the existing
  `/auth` routes.
- A tenant claim on the clinic access token.
- Clinic roles, and per-account permission grants held by the clinic.
- Sign-in, the role landing screen, and the patient list.

## Non-goals

- The queue, nurse station, doctor console, prescription, reception desk,
  billing, reports, kiosk, patient portal, and patient booking.
- Any change to the dispensary, the admin portal, or the public sites.
- A new account type other than `clinic`, and any rider or customer work.
- Moving the existing Next.js doctor app into this repository. It stays where it
  is for now.
- Reading `server_core`, `app-uploads/server-core/`, or
  `/medmate-repo/server-core/*`.
- More than one region. The platform runs in `ap-south-1` and this does too.
- A migration of clinic records from the Netlify app. The new service starts
  empty and is seeded with the demo clinic.
- Signing a clinic staff member up. A clinic owner creates the staff of their
  own clinic in a later requirement, where the Manage Users screen appears.
  For this slice, clinic accounts are seeded.
- The Manage Users screen itself. The grant store and the endpoint it will use
  exist from this slice; the screen does not.

## Behavior

### Accounts and roles

`CLINIC` joins `AccountType`. A clinic account has a `clinicId` and a
`clinicRole`, which is one of `OWNER`, `DOCTOR`, `NURSE`, `FRONT_DESK` or
`ADMIN`. An account with no clinic is not a clinic account and cannot sign in
to the doctor portal.

`AccountPrincipal` gains `clinicId` and `clinicRole`. Both are null for every
other account type. `AccountResponse` gains the same two fields, so the portal
reads the role it was issued.

`medmate-server` holds no clinic record. It knows which clinic an account
belongs to and which role it has there, and nothing else about the clinic. The
clinic itself - its name, its doctors, its patients - belongs to the clinic
service.

This is recorded in
[0029-clinic-accounts.md](../../medmate-server/decisions/0029-clinic-accounts.md).

### Sign-in

Sign-in uses the existing identity routes on the API root: `/auth/otp/send`,
`/auth/otp/verify`, `/auth/pin/set`, `/auth/pin`, `/auth/sign-out`. The doctor
portal sends `accountType: "clinic"`. The server resolves the phone to the one
clinic account for that phone.

The response is the existing session shape: an access token that expires after
15 minutes, a refresh token that expires after 30 days, and the account. A
clinic account that has not set a PIN is told that PIN setup is required, and
the portal shows the PIN setup screen before the landing screen.

In development the portal shows the code from `GET /sms-mock/messages`, matched
by phone the way the Bruno Send OTP request does. A production build does not
call the mock and does not render that box.

### The tenant claim

The access token of a clinic account carries `clinicId` and `clinicRole`. Every
other account type carries no such claim, and a token without `clinicId` is
rejected by the clinic API.

The claim is a change to how the access token is issued, so it is recorded in
[0030-clinic-tenant-claim.md](../../medmate-server/decisions/0030-clinic-tenant-claim.md).

### Per-clinic database routing

The clinic API is one service with many clinics. It keeps a `clinic_registry`
table on the shared Postgres instance, with one row per clinic holding
`clinic_id`, `database_name` and `display_name`. The `clinicId` in the access
token selects the registry row, and the service reads and writes only inside
that clinic's own database.

The registry holds no credentials. Every clinic database is reached with one
service role, and that role's secret comes from Secrets Manager like any other
application secret. The registry is the only table shared between clinics.

A clinic with no registry row, or a database that cannot be reached, is 503
with detail `Clinic records are unavailable`.

### The clinic API

`GET /clinic/me` returns the signed-in clinic account: the clinic id, the
clinic display name, the role, and the permission grants the account holds.

`GET /clinic/patients` returns that clinic's patients. It takes `page`,
`size`, `q` and `sort`, and the optional filters `status` and `due`, in the
same shape as the pharmacy patient list. `page` defaults to 1 and `size`
defaults to 25 and is 1 through 100. `q` matches the patient's name or phone,
ignoring case. `sort` is `name` or `last-seen`; `name` orders by last name
then first name. `status` is `waiting`, `with-doctor`, `seen` or `inactive`.
`due` is `true` or `false`, and selects patients with an outstanding amount.

The response is `{ "items", "page", "size", "total" }`. Each item is
`{ "id", "name", "age", "sex", "phone", "status", "due", "conditions",
"allergies", "abha", "lastSeen" }`. `phone` is masked as the last four digits
after a bullet run, for example `••••• 28051`. `lastSeen` is the name of the
doctor who last saw the patient, or null.

`conditions` and `allergies` are lists of strings. `abha` is true when the
patient has a health ID linked.

A missing or expired session receives 401 with detail `Session was not
accepted`. An account without the grant for the route receives 403 with detail
`This action is not allowed.`.

### Permissions

Clinic permissions are per-account grants. Each clinic account holds its own set
of grant keys, and the clinic owner can change them for their staff in a later
requirement. The grant store lives in the clinic's own database, so the clinic
service owns what its people may do inside it, and `medmate-server` keeps
ownership of who the person is.

The grant keys are namespaced with `clinic:` so they cannot collide with the
pharmacy keys in the same platform. `PharmacyPermissions` already holds
`patients:read`, which means something different there.

| Grant | Allows |
| --- | --- |
| `clinic:patients:read` | The patient list, with name, age, sex, masked phone, status and outstanding amount |
| `clinic:patients:read_clinical` | The clinical fields on a patient: conditions, allergies, health ID, last-seen doctor |
| `clinic:billing:read` | The outstanding amount on a patient, and the collected total |
| `clinic:staff:read` | The staff list of the clinic, which the Manage Users screen will use |

The grants held by the seeded clinic accounts are:

| Account | Role | Grants |
| --- | --- | --- |
| Dr. Ananya Rao | OWNER | all four |
| Dr. Vikram Shenoy | DOCTOR | `patients:read`, `patients:read_clinical`, `billing:read` |
| Mary Joseph | NURSE | `patients:read`, `patients:read_clinical` |
| Priya Shetty | FRONT_DESK | `patients:read`, `billing:read` |
| Kiran Bhat | ADMIN | `patients:read`, `staff:read` |
| New Receptionist | FRONT_DESK | none yet, so the denied case is real |

### The doctor portal

The portal has three screens in this slice: sign-in, the role landing screen,
and the patient list. Sign-in is the phone, OTP and PIN flow the dispensary
already uses.

The landing screen is role specific, not a menu of stations. A doctor lands on
their own patients, a nurse on the patients needing attention, the front desk
on who is waiting and what is owed, and the clinic admin on the clinic's
patients and its staff. Each screen is built from `/clinic/me` and the patient
list, because the queue, the billing and the staff list are later
requirements. The numbers on a landing screen are counts computed from the
patient list, and each one links to the patient list with the matching filter.

The patient list shows the patients of the signed-in clinic, with the filters
`q`, `status` and `due`, and every row opens the patient's record. The record
screen is not in this slice; a row shows the patient's detail inline and links
to the record once that requirement lands.

The portal talks to the clinic API through its own origin. In development
Vite proxies `/clinic-api` to the clinic service and `/auth` and `/sms-mock`
to `medmate-server` and the SMS mock, the same way the dispensary proxies
`/auth`. The portal holds the session in the auth slice of the Redux store and
sends `Authorization: Bearer <accessToken>` on every request, with a refresh
on 401, exactly as the dispensary client does.

## Acceptance criteria

- A clinic account signs in with a phone, an OTP and a PIN, and receives a
  session whose access token carries its `clinicId` and `clinicRole`.
- A pharmacy account, an admin account and a public account are unaffected by
  the clinic claim, and their access tokens carry no `clinicId`.
- The clinic API rejects a token with no `clinicId` claim with 401.
- The clinic API rejects a valid clinic token for a grant the account does not
  hold with 403 and detail `This action is not allowed.`.
- The front desk sees the patient's name, age, sex, masked phone, status and
  outstanding amount, and does not see conditions, allergies, the health ID or
  the last-seen doctor. The nurse sees the clinical fields but not the amount.
- Each clinic sees only its own patients. Two clinics in two databases never
  see each other's rows.
- The landing screen differs by role and shows that role's own next action.
- The patient list is empty for a clinic with no patients and is not empty
  for a clinic with patients.
- `page`, `size`, `q`, `sort`, `status` and `due` behave as described, and a
  page past the end returns an empty item list with the real total.
- Signing out clears the session and returns to sign-in.

## Tests

- `ClinicAccountRulesTest` for the clinic role, and for a clinic account with
  no grants.
- `ClinicTokenTest` for the `clinicId` and `clinicRole` claims on a clinic
  access token, and for their absence on every other account type.
- `ClinicRoutingTest` for the registry lookup, for an unknown clinic, and for
  a clinic whose database cannot be reached.
- `PatientRedactionTest` for the clinical fields appearing only with
  `clinic:patients:read_clinical`, and the amount only with
  `clinic:billing:read`.
- `ClinicMeControllerTest` and `ClinicPatientsControllerTest` for 401, 403,
  the filters, the ordering, and the response shape.
- `ClinicApiIT` for two clinics in two databases, the session, the grants and
  the redaction rules end to end.
- `DoctorAuthTest` and `DoctorPatientsTest` for the portal sign-in, the
  landing screen per role, and the patient list.
- Bruno `identity/auth/send-clinic-otp.bru` and
  `identity/auth/verify-clinic-otp.bru`, and `clinic/me.bru` and
  `clinic/list-patients.bru`.
