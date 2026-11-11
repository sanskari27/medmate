# Pharmacy type and owner application

## Context

[Identity and pharmacy verification](2026-11-11-identity-and-pharmacy-verification.md) accepts one complete `POST /pharmacy/application` from `incomplete` or `rejected`. [Pharmacy application review detail](2026-11-11-pharmacy-application-review-detail.md) lets compliance and admin read the stored fields. The owner cannot read those fields back. A resubmit also drops every stored document that is not uploaded again, because the submit path deletes the pharmacy's document rows and then inserts only the new files.

The dispensary setup wizard needs a required pharmacy-or-hospital choice, a way for a rejected owner to see the saved application, and a resubmit that keeps a document the owner does not replace. This requirement does not read the old server-core database, upload prefix, or SSM parameters.

## Scope

- Store `pharmacyType` as `pharmacy` or `hospital` on a successful submission.
- Return `pharmacyType` from `GET /pharmacy-applications/{id}`.
- Add `GET /pharmacy/application` for the pharmacy owner.
- On submit, keep a stored document when that file part is omitted, and replace it when a new file is sent.
- A required document is satisfied by a new file or by a document already stored for that slot.

## Non-goals

- A saved draft, a partial submit, or a new status.
- Different required fields or documents for a hospital and a pharmacy.
- Removing industry, business types, or any current required field.
- A control that deletes a stored document without replacing it.
- Changing who may submit, the compliance-then-admin sequence, emails, or `GET /pharmacy/verification`.
- Letting pharmacy staff, customers, riders, or platform staff read the owner application.
- A new module, datastore, auth model, or host. The column uses the existing Flyway migration in [0004](../decisions/0004-production-postgres-and-flyway.md). Documents stay under [0005](../decisions/0005-pharmacy-document-storage.md). Document links stay under [0006](../decisions/0006-presigned-pharmacy-document-links.md).
- Dispensary or admin UI.
- Reading `server_core`, `app-uploads/server-core/`, or `/medmate-repo/server-core/*`.

## Behavior

### Pharmacy type

`pharmacy.pharmacy_type` is text and nullable. It stays null until the first successful submission. A successful submission stores exactly `pharmacy` or `hospital`.

`POST /pharmacy/application` accepts multipart field `pharmacyType`. Missing, blank, or any other value is 400 and changes nothing. The other field and file rules are unchanged, except the document rule below.

`GET /pharmacy-applications/{id}` includes `pharmacyType`. It is null when the pharmacy has never been submitted.

### Owner read

`GET /pharmacy/application` returns the caller's own pharmacy. The caller must be a pharmacy owner. Pharmacy staff, customers, riders, platform staff, and admin receive 403. A missing pharmacy row is 404.

The body matches the review detail, including `pharmacyType`, `rejection`, and `documents`. Text that was never submitted is null. `documents` lists only stored slots, in the same order, each as `{ "slot", "contentType", "url" }`. `url` uses the same local download path or 15-minute presigned S3 GET as the review detail. The response does not include the object key or the file bytes.

An `incomplete` pharmacy that has never been submitted returns null text, `pharmacyType` null, an empty document list, and `submittedAt` null. A `rejected` pharmacy returns the last stored submission and the current rejection.

### Documents on submit

Required slots remain `gst`, `pan`, `drug-licence`, `fssai`, `trade-licence`, `pharmacist-certificate`, and `signature`. `logo` stays optional.

For each slot, a non-empty uploaded file replaces the stored object and content type. An omitted or empty part leaves the stored object in place. The submit path must not delete a slot that this request did not upload.

A required slot fails validation when the request has no file for it and the pharmacy has no stored document for it. A new file still has to match the existing type and size rules. Optional logo with no file and no stored logo is valid.

The first submission has no stored documents, so every required file is still required. A later submission from `rejected` may omit a file that is already stored. Sending `lowStockAlerts` false is still 400.

Status, review history, and the received email behave as they do today. A validation failure still changes nothing.

### Errors

Errors use the existing ProblemDetail JSON, including `requestId`.

| Status | When |
| --- | --- |
| 400 | Missing or unknown `pharmacyType`, or a required document that is neither uploaded nor already stored |
| 401 | Missing or bad session |
| 403 | Authenticated but not the pharmacy owner, on the owner read or on submit |
| 404 | The owner's pharmacy row does not exist |
| 409 | Submission while review is in progress |

## Acceptance criteria

- A complete first submission without `pharmacyType` stays `incomplete` and stores nothing.
- A complete first submission with `pharmacyType` `hospital` or `pharmacy` moves to `pending_compliance` and stores that value.
- `GET /pharmacy-applications/{id}` and `GET /pharmacy/application` both return that `pharmacyType`.
- After rejection, the owner read returns the saved fields, the rejection comment, and every stored document slot.
- A resubmit that omits one stored file keeps that file. A resubmit that uploads a new file for a slot replaces that slot only.
- A resubmit that omits a required file which was never stored stays `rejected` and changes nothing.
- Pharmacy staff and admin receive 403 on `GET /pharmacy/application`.

## Tests

`PharmacyRulesTest` covers a missing `pharmacyType`, a value other than `pharmacy` or `hospital`, a required file omitted when that slot is already stored, and a required file omitted when it is not stored.

`IdentityFlowIT` covers the first submission with `pharmacyType`, the owner read, 403 for staff and admin, the review detail field, rejection followed by a resubmit that keeps one omitted file and replaces another, and a 400 that leaves the previous documents in place.

Bruno requests:

- `bruno/medmate/identity/pharmacy/submit-application.bru` sends `pharmacyType`.
- `bruno/medmate/identity/pharmacy/read-application.bru` calls `GET /pharmacy/application` and asserts `pharmacyType`, `status`, and `documents`.
- `bruno/medmate/identity/review/read-application.bru` asserts `pharmacyType`.

No new ADR.
