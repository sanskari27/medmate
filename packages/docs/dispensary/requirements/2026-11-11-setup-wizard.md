# Dispensary setup wizard

## Context

A pharmacy owner who signs up starts at verification status `incomplete`. Dispensary currently sends every signed-in account to the dashboard. The pharmacy console already has a setup wizard, and that screen is the visual reference. It is not imported. The catalogue step is out of scope.

The server contract is [Pharmacy type and owner application](../../medmate-server/requirements/2026-11-11-pharmacy-type-and-owner-application.md). The wizard collects one application locally and submits it once.

## Scope

- A dispensary setup feature for the pharmacy owner.
- The wizard for `incomplete` and `rejected`.
- A waiting screen for `pending_compliance` and `pending_admin`.
- `pharmacyType` of `pharmacy` or `hospital` on the business step.
- Prefill of a rejected application, including documents the owner does not replace.

## Non-goals

- The admin portal, the pharmacy app, and edits to dashboard, users, settings, or reports.
- The catalogue step, bank verification, subscriptions, and staff PIN login.
- A browser draft. Refresh loads the server application again. Files chosen but not submitted are gone.
- Different fields or documents for a hospital and a pharmacy.
- Deleting a stored document without uploading a replacement.
- Importing `packages/apps/pharmacy`.

## Behavior

### Where the owner goes

After login, and on any later visit:

| Status | Owner sees |
| --- | --- |
| `incomplete`, `rejected` | `/setup` |
| `pending_compliance`, `pending_admin` | `/application-status` |
| `approved`, with PIN still required | the existing `/pin` screen |
| `approved` | the existing dashboard |

`/setup` and `/application-status` sit outside the dashboard shell. An owner in those statuses who opens `/dashboard` or another app route is sent back. Guest login follows the same table instead of always opening the dashboard. Both screens can sign out through the existing auth action.

The rejection comment is shown on `/setup` when status is `rejected`. It stays visible on every step. The stage is shown as Compliance or Admin.

### Wizard

The steps, in order, copy the pharmacy wizard's element order and placement. Catalogue is not a step.

1. Welcome
2. Business profile
3. Location
4. Tax and licences
5. Pharmacist
6. Invoice and branding
7. Features
8. Review

Welcome has the same four points and no fields. Continue is always allowed.

Business profile starts with a required single choice, Pharmacy or Hospital, using the same select control as registration type. The submitted values are `pharmacy` and `hospital`. Below that, the order is logo, name, tagline, business types, registration type, industry, phone, and email. Phone shows the account phone, is read-only, and is not sent as a different number. Logo, tagline, and business types stay optional. Name, registration type, industry, and email are required before continue.

Location keeps address, city, pincode, and state. State options are the server region list, including the union territories the pharmacy screen leaves out. Pincode is six digits and does not start with 0.

Tax and licences keeps GSTIN, PAN, drug licence, FSSAI, trade licence, each with its number and document, then Enable TDS and Enable TCS. GSTIN and PAN use the server patterns.

Pharmacist keeps the registered pharmacist name, then the pharmacist certificate. The pharmacy screen does not show that certificate. This step collects it because the server requires the file.

Invoice and branding keeps the invoice prefix, the signature image, and terms. The prefix is 1 to 16 letters, digits, or hyphens. Signature is an image.

Features keeps Accept online orders, Self-order kiosk, e-Invoicing, and Loose / per-tablet selling. Low-stock alerts stay a locked On row and are not sent as false.

Review lists the entered values, including pharmacy type, and each document as attached or missing. Finish asks for the same confirmation as the pharmacy wizard, then submits.

Continue checks only the current step. A missing required value stays on that step. The server remains the check that commits the application. A 400 is shown on Review and leaves the owner on `/setup`.

### Load and submit

Opening `/setup` calls `GET /pharmacy/application` through the portal API client. `incomplete` with no stored application starts empty. `rejected` fills the text fields from that response.

A stored document is shown as attached, with Replace. An image already stored can be shown the way the pharmacy signature row shows a chosen image. A PDF is shown as attached, without embedding the file. Replace selects a new file. Leaving it attached sends no file part for that slot.

Submit is one `multipart/form-data` `POST /pharmacy/application`. It sends the text fields and only the files the owner chose in this visit. Omitted slots stay on the server. The client does not hardcode a production URL.

A successful response updates the stored session status. The owner then sees `/application-status`.

### Waiting screen

`/application-status` is the multi-line waiting screen in [Application status waiting screen](2026-11-12-application-status.md). It does not show the form and does not offer an edit.

## Acceptance criteria

- An owner with `incomplete` or `rejected` lands on `/setup` and cannot open the dashboard.
- An owner with `pending_compliance` or `pending_admin` lands on `/application-status`.
- An approved owner still reaches PIN setup or the dashboard as they do today.
- The business step requires Pharmacy or Hospital before continue, and the submit sends `pharmacyType`.
- A rejected owner sees the review comment and the saved fields. A document they do not replace is not included in the multipart body.
- Continue on tax and licences requires each licence number and a new file or an already stored document. Continue on pharmacist requires the name and the certificate on the same rule.
- Welcome through features match the pharmacy screen's field order, with catalogue absent and the certificate present on the pharmacist step.

## Tests

- `setupValidation.test.ts` in the setup feature: pharmacy type required, GSTIN and pincode shapes, a missing required file, a stored document satisfying that file, and the pharmacist certificate.
- `SetupWizard.test.tsx`: the rejection comment renders, and submit omits a file part for a document that is already stored.
- `AppRouter.test.tsx`: `incomplete` and `rejected` open `/setup`, `pending_compliance` opens `/application-status`, and `approved` still opens the dashboard.
