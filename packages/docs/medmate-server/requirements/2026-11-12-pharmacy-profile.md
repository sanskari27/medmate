# Pharmacy profile

## Context

An approved pharmacy owner can correct the profile that was stored with the application. Licence numbers, their files, and the pharmacist are the fields compliance already checked on this call. Changing any of them sends the pharmacy through compliance review again. Other edits stay live. Terms and the signature are stored by [Pharmacy invoice settings](2026-11-12-pharmacy-invoice-settings.md), and this call ignores both. This does not read the old server-core service.

The dispensary screen is [Profile](../../dispensary/requirements/2026-11-12-profile.md). Review decisions stay the ones in [Identity and pharmacy verification](2026-11-11-identity-and-pharmacy-verification.md).

## Scope

- `POST /pharmacy/profile` for an approved pharmacy owner.
- `extra_details` on the pharmacy, returned by `GET /pharmacy/application`.
- A safe save that leaves the pharmacy `approved`.
- A review save that sets `pending_compliance` and sends the application-received email.

## Non-goals

- A second draft copy of the profile.
- Changing the login phone, invoice prefix, pharmacy type, online orders, kiosk, loose selling, or low-stock alerts from this call.
- Deleting a required licence file, the pharmacist certificate, or the signature without a replacement.
- A new review module, datastore, or auth scheme. No ADR.
- Admin and dispensary screens beyond the profile spec.
- Anything from server-core.

## Behavior

`POST /pharmacy/profile` is `multipart/form-data`. It is allowed only for a pharmacy owner whose pharmacy is `approved`.

Anyone else, including pharmacy staff, receives 403 with detail `Only the pharmacy owner can update the profile`. A pharmacy that is not `approved` receives 409 with detail `Profile can only be changed while the pharmacy is approved`. The pharmacy gate allows this POST when the pharmacy is not approved, so that 409 is reached instead of the business-route 403. A phone value, if sent, must match the account. The number is not stored as a new value. The detail for a mismatch stays `Phone number cannot be changed`.

The call does not accept invoice prefix, pharmacy type, online orders, kiosk, loose selling, or low-stock alerts. Those columns stay as stored.

Required text matches onboarding: name, email, address, city, state, pincode, registration type, industry, GSTIN, PAN, drug licence number, FSSAI number, trade licence number, and pharmacist name. Patterns and file types stay the ones in `PharmacyRules`. Tagline, logo, business types, and extra details may be empty. Enable TDS, Enable TCS, and e-Invoicing may be off. A `terms` value and a `signature` file on this call are ignored. The stored terms and signature stay, and that signature file does not start a review.

Extra details are a JSON array on the form field `extraDetails`. A missing or blank value stores `[]`. Each item has a trimmed label and value. The label is at most 80 characters, the value at most 200, and there are at most 20 rows. A row with a blank label or value is 400. More than 20 rows is 400 with detail `Too many extra details`. Invalid JSON is 400 with detail `Extra details are not valid.`

The column is `extra_details`, `TEXT NOT NULL DEFAULT '[]'`. `GET /pharmacy/application` returns `extraDetails`. `POST /pharmacy/application` does not write the column, so a later wizard resubmit keeps the rows.

`removeLogo` true deletes the stored logo when the request has no new logo file. Logo does not start a review. A required document slot that is omitted keeps the stored file.

A review is required when the normalized GSTIN or PAN differs, when a trimmed drug licence number, FSSAI number, trade licence number, or pharmacist name differs, or when the request includes a new file for GST, PAN, drug licence, FSSAI, trade licence, or the pharmacist certificate. A GSTIN or PAN that differs only by case does not. Logo does not. A signature file does not.

Both saves write the submitted text onto the pharmacy row. There is no second copy.

A safe save leaves `verification_status` and `submitted_at` unchanged, writes no review decision, and sends no email. It still updates the owner display name when the business name changed. A new logo is stored. A removed logo is deleted.

A review save also sets `pending_compliance`, clears the current rejection, sets `submitted_at`, and sends the same application-received email as onboarding. Older review decisions stay. This call does not insert a decision row. The existing compliance decision, then the admin decision, applies. The PIN is not cleared. Until the pharmacy is `approved` again, business routes return 403 for the owner and for that pharmacy's staff.

Field and file failures stay 400 with the existing `PharmacyRules` details. Errors stay `ProblemDetail`.

## Acceptance criteria

- An approved owner can change the tagline, e-invoicing, and an extra detail. The status stays `approved`, `submitted_at` is unchanged, the invoice prefix and online-orders flag stay, and no application email is sent.
- Changing the GSTIN, or replacing a licence file, sets `pending_compliance`. A business route then returns 403. An omitted licence file is kept.
- A second profile save while the review is open returns 409.
- Pharmacy staff receive 403.
- After the review is approved again, PIN login still applies.

## Tests

- `PharmacyRulesTest` for a safe change, a licence change, a pharmacist change, a signature file that does not review, a logo file that does not review, and a cleared GSTIN.
- `IdentityFlowIT` for the safe save, the GSTIN and file change, the kept file, the staff 403, and the PIN that remains.
- Bruno request `bruno/medmate/identity/pharmacy/update-profile.bru`.

No ADR. The identity module, the document store, and the review flow stay as they are.
