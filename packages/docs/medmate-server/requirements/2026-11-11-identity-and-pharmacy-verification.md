# Identity and pharmacy verification

## Context

medmate-server is the API for a multi-tenant pharmacy CRM. Each pharmacy is a tenant. Admin and platform staff sit outside any one pharmacy and can work across all of them. Customer and rider accounts are global. The service had no authentication, no Flyway migrations, and no object storage. This requirement adds those, and it does not read the old server-core database, upload prefix, or SSM parameters.

## Scope

- Separate accounts per type for one Indian mobile: `admin`, `pharmacy`, `customer`, `rider`, `staff`. At most one account of each type.
- OTP login, pharmacy-owner PIN after approval, refresh sessions, and sign-out.
- Pharmacy-owner signup and one complete verification submission, stored with private documents.
- Compliance review, then admin review.
- Platform-staff subtypes and pharmacy-staff permission keys.
- Email through Resend when an application is received, approved, or rejected.
- A local SMS mock and a GitHub workflow that creates an admin.

## Non-goals

- Pharmacy, customer, or rider UI changes.
- Customer or rider profile fields beyond the phone number.
- Inventory, billing, finance, sales, or support APIs. Later specs name those permission keys.
- A permission catalogue beyond the keys a pharmacy owner chooses to store.
- Assigning platform staff to a subset of pharmacies.
- More than one pharmacy account per phone.
- Staff PIN login, the setup-wizard catalogue step, bank verification, and subscriptions.
- Revoking an approved pharmacy.
- Reading `server_core`, `app-uploads/server-core/`, or `/medmate-repo/server-core/*`.

## Behavior

### Accounts

A phone is an Indian mobile. Callers may send 10 digits starting with 6-9, or the same number as `+91`. The server stores `+91` and the 10 digits. Any other value is a bad request.

Every auth call includes `accountType`. The same phone may hold one account of each type. A pharmacy account is either the owner of one pharmacy or a staff member of one pharmacy.

| Account | Created by | Login |
| --- | --- | --- |
| customer, rider | First successful login OTP | OTP |
| pharmacy owner | Signup OTP. Status starts at `incomplete` | OTP until a PIN is set after approval, then PIN |
| pharmacy staff | An approved owner of that pharmacy | OTP |
| staff | An admin, with one or more subtypes | OTP |
| admin | The GitHub workflow only | OTP |

Login OTP for pharmacy, staff, or admin does not create an account. Signup OTP is only valid for `pharmacy`. A second pharmacy signup for the same phone returns 409.

Disabled accounts cannot sign in.

### OTP, session, and PIN

OTP is 6 digits, expires after 10 minutes, and allows 5 checks. A new code for the same phone, account type, and purpose replaces the previous one. The code is stored hashed. Purposes are `login`, `signup`, and `pin_reset`.

`POST /auth/otp/send` with `{ phone, accountType, purpose }` returns `{ "mode": "otp" }` or `{ "mode": "pin" }`.

- `login` for an approved pharmacy owner who already has a PIN returns `pin` and does not send a code.
- `login` for a missing pharmacy, staff, or admin account returns `otp` and does not send a code.
- `login` for customer or rider always sends a code. Verify creates the account when it is missing.
- `signup` for an existing pharmacy account returns 409 and does not send a code.
- `pin_reset` sends a code only when that pharmacy owner is approved and already has a PIN. Otherwise it is a bad request.

Local development POSTs `{ "phone", "code" }` to `{sms-base-url}/messages`, which points at the mock on port 8090. Tests use an in-memory sender. Production, when `MEDMATE_SMS_API_KEY` is set, sends the approved Telinfy SMS for that purpose: `login` uses template `1777179371662098726`, `signup` uses `1777179371651147672`, and `pin_reset` uses `1777179371668989529`. The sender is `MEDMTE`. The message is the approved body with the code in place of `{{1}}`, and the number is the 10 digits after `+91`. A delivery failure is 503 and does not leave a usable code.

`POST /auth/otp/verify` with `{ phone, accountType, purpose, code }` returns a session when the code matches. A missing code, a wrong code, an expired code, and a code with too many checks are 401. The client cannot tell a missing account from a wrong code on login verify.

A session is:

```json
{
  "accessToken": "<jwt>",
  "refreshToken": "<secret>",
  "expiresIn": 900,
  "account": {
    "id": "<uuid>",
    "accountType": "pharmacy",
    "phone": "+919876543210",
    "displayName": null,
    "pharmacyId": "<uuid>",
    "pharmacyRole": "owner",
    "verificationStatus": "incomplete",
    "rejection": null,
    "subtypes": [],
    "permissions": [],
    "pinSetupRequired": false
  }
}
```

The access JWT lasts 15 minutes and carries the account id. Each request loads the role, grants, and verification status from Postgres. Pharmacy staff `permissions` are the granted keys. An owner has `pharmacyRole` `owner` and an empty key list. `pinSetupRequired` is true only for an approved owner who has not set a PIN. `rejection` is `{ "stage": "compliance"|"admin", "comment": "..." }` while the status is `rejected`, and null otherwise. Non-pharmacy accounts leave pharmacy fields null.

The refresh token lasts 30 days, is stored hashed, and rotates on `POST /auth/refresh` with `{ refreshToken }`. `POST /auth/sign-out` with `{ refreshToken }` revokes it. Sign-out does not invalidate an access token that has not expired yet.

`POST /auth/pin` with `{ phone, accountType, pin }` signs in an approved owner whose PIN matches. The PIN is 4 digits. A mismatch is 401. `POST /auth/pin/set` with a bearer token and `{ pin }` sets or replaces the PIN. It is allowed only for an approved pharmacy owner. `pin_reset` verify returns a normal session so the owner can call `pin/set`.

`POST /auth/admin-bootstrap` with `Authorization: Bearer <bootstrap token>` and `{ phone }` creates an admin. The same phone again returns the existing admin and `"created": false`. The bootstrap token is not a user JWT. Application code has no other way to create an admin.

### Pharmacy submission

Signup creates the pharmacy tenant and the owner account in status `incomplete`.

`POST /pharmacy/application` is one multipart submission. There is no saved draft. It is accepted from `incomplete` or `rejected`. While a review is in progress it returns 409 and changes nothing. A validation failure returns 400 and changes nothing.

Required fields:

- Pharmacy name, registration type, industry, email
- Billing address, city, 6-digit pincode, and a state or union territory from the server list
- GSTIN in the 15-character pattern `^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z][1-9A-Z]Z[0-9A-Z]$`, plus a GST certificate
- PAN in the pattern `^[A-Z]{5}[0-9]{4}[A-Z]$`, plus a PAN card
- Drug licence number and document, FSSAI number and document, trade licence number and document
- Registered pharmacist name and certificate
- Invoice prefix of 1 to 16 letters, digits, or hyphens, plus a signature image

Optional: logo, tagline, terms, business types (multi-select from the six pharmacy types), Enable TDS, Enable TCS, and the feature toggles Accept online orders, Self-order kiosk, e-Invoicing, and Loose / per-tablet selling.

Registration types: Proprietorship, Partnership, Private Limited Company, LLP, HUF, Public Limited Company, Not Registered.

Industries: Pharmacy & Healthcare, Retail, Wholesale, Hospital / Clinic, Diagnostics.

Business types: Retail Pharmacy, Wholesale / Distribution, Hospital Pharmacy, Online Pharmacy, Ayurvedic / Generic, Surgicals & Equipment.

Low-stock alerts are always on. Sending false is a bad request.

The login phone is not writable. A submitted phone must match the account. GSTIN and PAN are stored in uppercase.

Licence and pharmacist files are JPEG, PNG, WEBP, or PDF, up to 5 MiB. Logo and signature are JPEG, PNG, or WEBP, up to 2 MiB. Objects are private under `app-uploads/medmate-server/pharmacy-documents/{pharmacyId}/{slot}`. Local and tests use an in-memory store. Production uses S3 when `APP_UPLOADS_BUCKET` is set.

`GET /pharmacy/verification` returns the status, rejection, and whether a PIN still needs to be set. The owner, compliance, and admin may `GET /pharmacies/{pharmacyId}/documents/{slot}`.

A successful submission moves the pharmacy to `pending_compliance`, keeps an append-only review history, and emails the owner that the application was received.

### Review

```text
incomplete --submit--> pending_compliance
pending_compliance --approve--> pending_admin
pending_compliance --reject--> rejected
pending_admin --approve--> approved
pending_admin --reject--> rejected
rejected --submit--> pending_compliance
```

`POST /pharmacy-applications/{id}/compliance-decision` with `{ decision, comment }` is allowed for an admin or a platform staff account that holds `compliance`. `decision` is `approve` or `reject`. Reject requires a comment. This call is the only way to leave `pending_compliance`. An admin may record it, and a later admin call still has to record the final decision.

`POST /pharmacy-applications/{id}/admin-decision` is admin-only and only from `pending_admin`.

`GET /pharmacy-applications?status=pending_compliance|pending_admin` is allowed for admin and compliance staff.

Until `approved`, a pharmacy account receives 403 on business routes. They can still call auth routes, `GET /pharmacy/verification`, `POST /pharmacy/application`, and their own document reads. Approval and rejection emails go to the owner. The rejection email includes the comment. A new submission clears the current rejection and starts at compliance again. Older decisions stay in the history.

### Access

Admin can perform every platform action for every pharmacy, including the compliance decision. Admin does not pick permission keys and does not assign a staff member to specific pharmacies.

Platform staff subtypes grant every action in their module for every pharmacy. Several subtypes grant the union.

| Subtype | Modules |
| --- | --- |
| finance | finance, accounting |
| compliance | compliance |
| sales | sales |
| support | support |

An admin creates platform staff with `POST /staff` `{ phone, displayName, subtypes }` and replaces them with `PATCH /staff/{id}` `{ displayName, subtypes, disabled }`. Subtypes must be non-empty. The phone must not already have a staff account.

An approved owner creates pharmacy staff with `POST /pharmacy/staff` `{ phone, displayName, permissions }` and replaces them with `PATCH /pharmacy/staff/{id}`. Permission keys match `^[a-z0-9-]+:[a-z0-9-]+$`, for example `inventory:read`. They apply only inside that pharmacy, and only while the pharmacy is approved. The owner has every pharmacy key without storing them. Keys are not a platform-module grant.

### Email and the admin workflow

Mail uses Resend. The API key is `RESEND_API_KEY`, supplied from `/medmate-repo/medmate-server/resend_api_key`. The server does not read `/medmate-repo/server-core/resend_api_key`. The from address is `Medmate <noreply@nammamedmate.com>`. A mail failure is logged and does not roll back the submission or the decision. Local and tests record messages instead of calling Resend.

`.github/workflows/medmate-admin.yml` is `workflow_dispatch` with a phone input. It assumes the infra AWS role, reads `/medmate-repo/medmate-server/admin_bootstrap_token`, and POSTs to `https://api.nammamedmate.com/auth/admin-bootstrap`.

JWT signing uses `MEDMATE_JWT_SECRET` from `/medmate-repo/medmate-server/jwt_secret`. The SMS base URL comes from `/medmate-repo/medmate-server/sms_base_url`. The Telinfy API key is `MEDMATE_SMS_API_KEY` from `/medmate-repo/medmate-server/sms_api_key`.

### Errors

Errors use the existing ProblemDetail JSON, including `requestId`.

| Status | When |
| --- | --- |
| 400 | Invalid phone, field, file, PIN shape, decision, or permission key |
| 401 | Missing session, bad session, bad OTP, bad PIN, bad bootstrap token |
| 403 | Authenticated but not allowed, including a pharmacy that is not approved |
| 409 | Duplicate account, or a submission while review is in progress |
| 503 | OTP could not be sent |

## Acceptance criteria

- One phone can sign up as a pharmacy owner and also verify as a customer. The accounts are different.
- A partial pharmacy submission does not change `incomplete`. A complete one moves to `pending_compliance` and stores the documents.
- Admin cannot record the final decision before the compliance decision. Admin can record the compliance decision.
- A compliance rejection with a comment is visible on the owner's verification read. A new complete submission returns to `pending_compliance`.
- Before approval, a pharmacy token can submit and read status, and a business route returns 403.
- After approval, OTP login reports `pinSetupRequired`. The next login after `pin/set` uses the PIN.
- A pharmacy staff member can use only the granted keys. A finance staff member cannot record a compliance decision.
- Refresh rotates. Sign-out revokes the presented refresh token.
- Running the bootstrap twice does not create a second admin.
- The health check still starts with no database and no security profile.

## Tests

Unit tests, without Spring, in `medmate-server-identity`:

- `PhoneNumbersTest`
- `OtpMachineTest`
- `PinsTest`
- `VerificationTest`
- `AccessTest`
- `PharmacyRulesTest`

`IdentityFlowIT` in `medmate-server-app` boots the process against Testcontainers Postgres and covers signup, the second account on the same phone, submission, both review steps, rejection and resubmit, the 403 gate, PIN setup, staff grants, refresh, sign-out, and bootstrap.

Bruno requests under `bruno/medmate/identity/`, split into `auth`, `pharmacy`, `review`, and `staff`, call the routes with `examplePhone` and `exampleRequestId`. `examplePharmacyId` is the sample pharmacy id.

ADRs: [0003](../decisions/0003-identity-and-access.md), [0004](../decisions/0004-production-postgres-and-flyway.md), [0005](../decisions/0005-pharmacy-document-storage.md).
