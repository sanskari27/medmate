# Pharmacy invoice settings

## Context

An approved pharmacy stores how a future invoice will print: template, accent, title, prefix, signatory, bank line, terms, and whether the logo, stamp, and bank line are shown. The logo and the pharmacist signature stay in the existing document slots. Changing the signature sends the pharmacy through compliance review again. Other invoice edits stay live.

The dispensary screen is [Invoice settings](../../dispensary/requirements/2026-11-12-invoice-settings.md). `POST /pharmacy/profile` no longer writes terms or the signature. Setup submit still does. This does not read the old server-core service.

## Scope

- `GET /pharmacy/invoice-settings` and `POST /pharmacy/invoice-settings`.
- Print columns on `pharmacy`, with defaults for rows that already exist.
- Permission keys `invoice-settings:read` and `invoice-settings:update` on the closed pharmacy catalog.
- A signature replacement that sets `pending_compliance` and sends the application-received email.

## Non-goals

- A footer, MRP savings, a doctor, or an HSN flag. The dispensary preview is drawn in the portal. This API only adds the pharmacy header the sample bill prints.
- A new document slot. Logo and signature keep their current slots.
- Clearing a stored signature, or deleting the logo from this call.
- A new module, datastore, or auth scheme. No ADR.
- The admin portal, the pharmacy app, and the setup wizard.
- Anything from server-core.

## Behavior

Both routes use `Access.pharmacy` for the caller’s pharmacy. An approved owner is allowed. A staff member needs the key named below. Anyone else, including a pharmacy that is not `approved`, receives 403.

`invoice-settings:read` is required for GET. The detail is `Invoice settings cannot be read`.

`invoice-settings:update` is required for POST. The detail is `Invoice settings cannot be updated`.

`GET /pharmacy/invoice-settings` returns `template`, `accent`, `title`, `prefix`, `signatory`, `bankLine`, `showBank`, `terms`, `showLogo`, `showStamp`, `logo`, `signature`, and `pharmacy`. `logo` and `signature` are null or `{ contentType, url }`. Responses include `url` and do not include the object key or the bytes. `url` is the existing document link: a 15-minute presigned GET when `APP_UPLOADS_BUCKET` is set, and otherwise `/pharmacies/{pharmacyId}/documents/{slot}`.

`pharmacy` is `{ name, address, phone, email, gstin, drugLicenceNo, pharmacistName }`. `address` joins the stored street, city, state, and pincode with `, ` and skips blanks. `phone` is the owner account phone. Each text field is an empty string when it is not stored. POST does not accept `pharmacy` and does not change these values.

The new columns are `invoice_template`, `invoice_accent`, `invoice_title`, `invoice_signatory`, `invoice_bank_line`, `invoice_show_logo`, `invoice_show_stamp`, and `invoice_show_bank`. Defaults for an existing row are `classic`, `#1B3D29`, `TAX INVOICE`, `Authorised signatory`, an empty bank line, show logo true, show stamp false, and show bank false. `invoice_prefix`, `terms`, and the signature document stay as stored.

`POST /pharmacy/invoice-settings` is `multipart/form-data`. It accepts `template`, `accent`, `title`, `prefix`, `signatory`, `bankLine`, `showBank`, `terms`, `showLogo`, `showStamp`, and optional `logo` and `signature` image parts.

`template` is `classic`, `modern`, `minimal`, or `thermal`. `accent` is `#` plus six hex digits. `title` and `signatory` are required and at most 80 characters. `prefix` matches `^[A-Za-z0-9-]{1,16}$`. `terms` may be blank and are at most 4000 characters. `bankLine` may be blank and is at most 160 characters. The three show fields are booleans. A missing boolean is 400.

Logo and signature use the existing image rules. A stored signature that is omitted is kept. A missing signature when none is stored returns the existing signature error. A stored signature cannot be cleared. A new logo replaces the logo slot. Omitting the logo keeps the stored logo. This call does not delete the logo.

A new signature file sets `pending_compliance`, clears the current rejection, sets `submitted_at`, and sends the same application-received email as onboarding. Template, accent, title, prefix, signatory, bank line, terms, logo, and the three toggles do not. A safe save leaves `verification_status` and `submitted_at` unchanged and sends no email.

POST returns the saved print settings, without `pharmacy`, plus `status`, `rejection`, and `pinSetupRequired`.

`POST /pharmacy/profile` ignores `terms` and `signature`. The stored terms and signature stay, and a signature part on that route does not start a review. `POST /pharmacy/application` still writes both.

Field and file failures stay 400 with the existing `PharmacyRules` details. Errors stay `ProblemDetail`.

## Acceptance criteria

- An approved owner can read the defaults, including the pharmacy header, and change the title. The status stays `approved` and no application email is sent. The header is unchanged by that save.
- Replacing the signature sets `pending_compliance`. A later invoice-settings call returns 403.
- A staff member with `invoice-settings:read` can read and cannot update. A staff member with `invoice-settings:update` can update. A staff member with neither receives 403.
- A profile update that sends terms and a signature leaves both stored values unchanged and leaves the pharmacy `approved`.

## Tests

- `PharmacyRulesTest` for a valid print update, a bad template, a bad accent, a long title, a missing signature, and a profile review that ignores a signature file.
- `IdentityFlowIT` for the owner read, including the pharmacy header, the title update leaving that header unchanged, the signature review, staff read without update, staff update, a missing permission 403, and a profile update that leaves terms and signature untouched.
- Bruno requests `bruno/medmate/identity/pharmacy/read-invoice-settings.bru` and `update-invoice-settings.bru`.

No ADR. The identity module, the document store, and the review flow stay as they are.
