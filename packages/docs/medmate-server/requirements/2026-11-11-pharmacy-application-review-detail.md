# Pharmacy application review detail

## Context

[Identity and pharmacy verification](2026-11-11-identity-and-pharmacy-verification.md) stores a pharmacy application and its private documents, then walks compliance and admin through one overall decision each. The queue lists only a summary. A reviewer cannot read the submitted fields, or see which documents were stored, before approving or rejecting. Compliance and admin need that read. They still record one decision and one comment for the whole application.

## Scope

- `GET /pharmacy-applications/{id}` returns every stored application field and the stored document slots.
- Each document includes a link. Production uses a presigned S3 URL. Local and tests use the download route.
- Admin and compliance staff can call it for any existing pharmacy.
- Bruno, the identity flow test, and this spec stay aligned with that route.

## Non-goals

- A per-field or per-document approve, reject, or comment. Nothing new is stored for a review.
- Changing who may record a decision, or the compliance-then-admin sequence.
- Changing `POST /pharmacy-applications/{id}/compliance-decision` or `POST /pharmacy-applications/{id}/admin-decision`.
- Changing `GET /pharmacy-applications`, `GET /pharmacy/verification`, or `POST /pharmacy/application`.
- Returning file bytes or object-storage keys in the application JSON.
- Letting the pharmacy owner, pharmacy staff, or any other platform subtype read this route.
- Pharmacy, customer, rider, or admin UI changes.
- A new module, table, auth model, or host. Document links are [0006](../decisions/0006-presigned-pharmacy-document-links.md).
- Reading `server_core`, `app-uploads/server-core/`, or `/medmate-repo/server-core/*`.

## Behavior

### Who can read

The caller must be an admin, or a platform staff account that holds `compliance`. The same check as `GET /pharmacy-applications` applies. A disabled account is rejected.

A pharmacy owner, pharmacy staff member, customer, rider, or staff account without `compliance` receives 403. An unknown pharmacy id receives 404. A known id is returned at every verification status, including `incomplete`, `rejected`, and `approved`. The queue list is unchanged and still accepts only `pending_compliance` and `pending_admin`.

### Response

`GET /pharmacy-applications/{id}` returns the stored application. Text that was never submitted is null. Booleans are the stored values. `lowStockAlerts` stays true. `businessTypes` is the stored list, or an empty list. `submittedAt` is null until the first successful submission.

`rejection` matches the verification read: `{ "stage": "compliance"|"admin", "comment": "..." }` while the status is `rejected`, and null otherwise. Older review history is not included.

`documents` lists only slots that are stored, in this order: `logo`, `gst`, `pan`, `drug-licence`, `fssai`, `trade-licence`, `pharmacist-certificate`, `signature`. Each entry is `{ "slot", "contentType", "url" }`. A missing optional logo is omitted. An `incomplete` pharmacy has an empty list.

`url` is a link to that file. When `APP_UPLOADS_BUCKET` is set, it is an HTTPS presigned S3 GET for the private object, valid for 15 minutes. Locally and in tests it is `/pharmacies/{pharmacyId}/documents/{slot}`. The response does not include the object key or the file bytes. The download route is unchanged.

```json
{
  "pharmacyId": "<uuid>",
  "status": "pending_compliance",
  "rejection": null,
  "phone": "+919876543210",
  "name": "Shree Medicals",
  "tagline": null,
  "email": "owner@example.com",
  "address": "12 Market Road",
  "city": "Bengaluru",
  "state": "Karnataka",
  "pincode": "560001",
  "businessTypes": ["Retail Pharmacy"],
  "industry": "Pharmacy & Healthcare",
  "registrationType": "Proprietorship",
  "gstin": "29ABCDE1234F1Z5",
  "pan": "ABCDE1234F",
  "drugLicenceNo": "DL-1",
  "fssaiNo": "11223344556677",
  "tradeLicenceNo": "TL-1",
  "enableTds": false,
  "enableTcs": false,
  "pharmacistName": "A. Rao",
  "invoicePrefix": "SHREE",
  "terms": null,
  "acceptOnlineOrders": false,
  "selfOrderKiosk": false,
  "eInvoicing": false,
  "looseSelling": false,
  "lowStockAlerts": true,
  "submittedAt": "2026-11-11T10:00:00Z",
  "documents": [
    { "slot": "gst", "contentType": "application/pdf", "url": "/pharmacies/<uuid>/documents/gst" },
    { "slot": "pan", "contentType": "image/jpeg", "url": "/pharmacies/<uuid>/documents/pan" },
    { "slot": "drug-licence", "contentType": "application/pdf", "url": "/pharmacies/<uuid>/documents/drug-licence" },
    { "slot": "fssai", "contentType": "application/pdf", "url": "/pharmacies/<uuid>/documents/fssai" },
    { "slot": "trade-licence", "contentType": "application/pdf", "url": "/pharmacies/<uuid>/documents/trade-licence" },
    { "slot": "pharmacist-certificate", "contentType": "application/pdf", "url": "/pharmacies/<uuid>/documents/pharmacist-certificate" },
    { "slot": "signature", "contentType": "image/png", "url": "/pharmacies/<uuid>/documents/signature" }
  ]
}
```

`phone` is the owner account phone. The login phone on the application is not a separate field.

The sample `url` values are the local form. Production replaces each one with a presigned S3 URL for the same slot.

### Decisions

After reading the fields and documents, compliance, or an admin acting as compliance, still records one overall approve or reject with `POST /pharmacy-applications/{id}/compliance-decision`. Admin still records the final overall decision with `POST /pharmacy-applications/{id}/admin-decision`, and only from `pending_admin`. Reject still requires one comment. No item mark is required or stored.

### Errors

Errors use the existing ProblemDetail JSON, including `requestId`.

| Status | When |
| --- | --- |
| 401 | Missing or bad session |
| 403 | Authenticated but not admin or compliance staff |
| 404 | Pharmacy id does not exist |

## Acceptance criteria

- After a complete submission, an admin and a compliance staff member can read every submitted field and every stored document slot on `GET /pharmacy-applications/{id}`.
- The document list omits a logo that was not uploaded. Each stored document has a `url`. Locally that url is the download route. The list does not include file bytes or an object key.
- `GET /pharmacies/{pharmacyId}/documents/{slot}` still returns the file for a slot in that list.
- A finance staff member and the pharmacy owner receive 403 on the new route. An unknown id is 404.
- The queue list stays a summary. Compliance must still approve before admin can record the final decision. One comment still covers the whole application.
- An `incomplete` pharmacy can be read by id and returns null text fields, an empty document list, and a null `submittedAt`.

## Tests

`DocumentLinksTest` checks the local download path and that a production link is a 15-minute presigned S3 GET. The route adds no access rule beyond the existing platform `compliance` check.

`IdentityFlowIT` covers the detail read after submission, the document slot list, a follow-up document read, 403 for finance and for the owner, 404 for an unknown id, and that both decision routes still take one overall decision.

Bruno request: `bruno/medmate/identity/review/read-application.bru`, using `examplePharmacyId` and `exampleRequestId`. It asserts the status and the response fields this route guarantees.
