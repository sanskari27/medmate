# Hospital doctors

## Context

An approved hospital records the doctors who consult there. The directory holds identity, registration, contact, one workplace, consultation windows, the pharmacy relationship, and documents. It is not a login account and it is not an employee. The dispensary screen is [Hospital doctors](../../dispensary/requirements/2026-11-14-hospital-doctors.md). File storage follows [0005](../decisions/0005-pharmacy-document-storage.md) and [0006](../decisions/0006-presigned-pharmacy-document-links.md). The module boundary is [0024](../decisions/0024-hospital-doctors.md).

## Scope

- `GET /pharmacy/doctors` and `GET /pharmacy/doctors/{id}`.
- `POST /pharmacy/doctors` and `PATCH /pharmacy/doctors/{id}` as JSON, or as multipart when a photo or documents are included.
- `GET /pharmacy/doctors/{id}/documents/{documentId}` and `GET /pharmacy/doctors/{id}/photo` for the local download route.
- Permission keys `doctors:read`, `doctors:create`, and `doctors:update` on the closed pharmacy catalog.
- `pharmacyType` on the signed-in account, taken from the pharmacy row.

## Non-goals

- Associated patients and prescription history.
- A second workplace, a primary-workplace choice, or a delete route.
- Removing an uploaded document.
- A human-readable Doctor ID on the screen. The row id stays internal.
- Pagination of this directory.
- Reading `server_core`, `app-uploads/server-core/`, or `/medmate-repo/server-core/*`.

## Behavior

Every route uses `Access.pharmacy` for the caller's pharmacy, then reads the pharmacy row. An approved owner of a hospital is allowed. A staff member of a hospital needs the key named below. A caller whose pharmacy type is not `hospital` receives 403 with detail `Doctors are only available for a hospital`, including an owner. Anyone else who fails the permission check receives the detail named below.

`doctors:read` is required for the list, the one-doctor read, and both download routes. The detail is `Doctors cannot be read`.

`doctors:create` is required to create. The detail is `Doctors cannot be created`.

`doctors:update` is required for any change, including a photo, a document, a window, status, and verification status. The detail is `Doctors cannot be updated`.

`GET /pharmacy/doctors` returns that pharmacy's doctors ordered by display name, then code, ignoring case. Each doctor includes windows and document links. The response is the full list. There is no `page` or `size`.

`GET /pharmacy/doctors/{id}` returns one `doctor`. An id outside this pharmacy is 404 with detail `Doctor was not found`.

Each doctor is `id`, `code`, `firstName`, `lastName`, `displayName`, `gender`, `status`, `registrationNumber`, `registrationCouncil`, `registrationState`, `qualification`, `specialization`, `subSpecialization`, `yearsExperience`, `primaryMobile`, `alternateMobile`, `email`, `whatsapp`, `relationshipStatus`, `notes`, `workplaceName`, `workplaceType`, `address`, `city`, `state`, `pinCode`, `workplacePhone`, `photo`, `windows`, and `documents`. `photo` is null or `{ fileName, contentType, url }`. Each document is `{ id, documentType, fileName, contentType, verificationStatus, url }`. Each window is `{ type, days, start, end, fee }`. Responses include `url` and do not include the object key or the bytes. When the bucket is set, `url` is a 15-minute presigned GET. Otherwise the photo url is `/pharmacy/doctors/{id}/photo` and a document url is `/pharmacy/doctors/{id}/documents/{documentId}`.

`id` is a server UUID. A client-sent id on create is ignored. The form does not show it. `code` is required, trimmed, at most 32 characters, and unique for that pharmacy ignoring case. It can change on update. A duplicate returns 409 with detail `Doctor code is already in use`.

Create and update require a trimmed code, first name, last name, display name, gender, status, primary mobile, registration number, qualification, specialization, workplace name, city, state, PIN, and at least one window. Gender is `male`, `female`, or `other`. Status is `active` or `inactive`. A missing status on create is `active`.

Optional text is registration council, registration state, sub-specialization, alternate mobile, email, WhatsApp, workplace type, address, workplace phone, relationship status, and notes. Blank optional text is stored as null. An omitted field on update stays as stored. A present blank optional text clears it.

Registration state, when set, and workplace state are one of `PharmacyRules.REGIONS`. Workplace type, when set, is `clinic`, `hospital`, or `nursing-home`. Relationship status, when set, is `in-house`, `visiting`, or `on-call`. The single workplace is the primary workplace. There is no primary flag.

Phones use `PhoneNumbers` and are stored as `+91` national mobiles. Email, when set, matches `^[^@\s]+@[^@\s]+\.[^@\s]+$` and is at most 160 characters. PIN matches `^[1-9][0-9]{5}$`. Years of experience, when set, is a whole number from 0 through 99.

Each window has `type` (`online`, `offline`, or `both`), `days` (one or more of `monday` through `sunday`), `start`, `end`, and `fee`. Start and end are `HH:mm` and start is before end. Fee is a rupee amount, zero or greater, with at most two decimal places, sent as a decimal string. Windows may overlap. The stored windows are replaced by the list on the request. At least one must remain.

A photo is JPEG or PNG, up to 2 MiB. A document is JPEG, PNG, or PDF, up to 5 MiB. Document type is trimmed free text, required for each new file, at most 80 characters. A new document defaults to `pending` when status is omitted. Staff may send `pending`, `verified`, or `rejected` on create and on an existing document. Documents are appended. An uploaded document is not removed. A new photo replaces the old object. `removePhoto: true` deletes it when no new photo is sent.

Objects use the existing document store and the prefix `app-uploads/medmate-server`. The photo key is `doctor-documents/{pharmacyId}/{doctorId}/photo`. A document key is `doctor-documents/{pharmacyId}/{doctorId}/{documentId}`. Local and tests use the in-memory store.

The signed-in account includes `pharmacyType` (`pharmacy` or `hospital`) when the caller belongs to a pharmacy, and null otherwise.

| Status | Detail |
| --- | --- |
| 400 | `Doctor code is required` |
| 400 | `Doctor code is too long` |
| 400 | `First name is required` |
| 400 | `Last name is required` |
| 400 | `Display name is required` |
| 400 | `Gender is not recognised` |
| 400 | `Status is not recognised` |
| 400 | `Primary mobile is required` |
| 400 | `Mobile number is invalid` |
| 400 | `Registration number is required` |
| 400 | `Qualification is required` |
| 400 | `Specialization is required` |
| 400 | `Workplace name is required` |
| 400 | `City is required` |
| 400 | `State is not recognised` |
| 400 | `PIN code is invalid` |
| 400 | `A consultation window is required` |
| 400 | `Consultation type is not recognised` |
| 400 | `Consultation day is not recognised` |
| 400 | `Consultation time is invalid` |
| 400 | `Consultation fee is invalid` |
| 400 | `Years of experience is invalid` |
| 400 | `Email is invalid` |
| 400 | `Workplace type is not recognised` |
| 400 | `Relationship status is not recognised` |
| 400 | `Document type is required` |
| 400 | `Verification status is not recognised` |
| 400 | `File type is not allowed` |
| 400 | `File is too large` |
| 403 | `Doctors are only available for a hospital` |
| 403 | `Doctors cannot be read` |
| 403 | `Doctors cannot be created` |
| 403 | `Doctors cannot be updated` |
| 404 | `Doctor was not found` |
| 409 | `Doctor code is already in use` |

Create responds 201. Update and the reads respond 200.

## Acceptance criteria

- A hospital owner creates a doctor with a photo, a document, and one window, then updates the code and the document status.
- A second doctor with the same code, ignoring case, is 409 and is not stored.
- A retail pharmacy owner receives 403 `Doctors are only available for a hospital`.
- A hospital staff member with only `doctors:read` can list doctors and cannot create one.
- A file that is not JPEG, PNG, or PDF is refused and is not stored.

## Tests

- `DoctorRulesTest` for the required set, the code length, windows, phones, PIN, fees, and file limits.
- `DoctorsFlowIT` for a hospital create and update with a photo and a document, a duplicate code, a retail 403, and a staff member missing `doctors:read`.
- Bruno: `doctors/list-doctors.bru`, `doctors/create-doctor.bru`, and `doctors/update-doctor.bru`.

The module and the object prefix are [0024](../decisions/0024-hospital-doctors.md).
