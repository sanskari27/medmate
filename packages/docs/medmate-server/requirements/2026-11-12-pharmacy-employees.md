# Pharmacy employees

## Context

An approved pharmacy records the people who work there: personal details, employment, statutory ids, documents, salary bank account, and an emergency contact. This register is not a login account. The dispensary screen is [Manage employees](../../dispensary/requirements/2026-11-12-manage-employees.md). File storage follows [0005](../decisions/0005-pharmacy-document-storage.md) and [0006](../decisions/0006-presigned-pharmacy-document-links.md). The module boundary is [0011](../decisions/0011-employee-register.md).

## Scope

- `GET /pharmacy/employees` and `GET /pharmacy/employees/{code}`.
- `POST /pharmacy/employees` and `PATCH /pharmacy/employees/{code}` as JSON, or as multipart when a photo or documents are included.
- `GET /pharmacy/employees/{code}/photo` and `GET /pharmacy/employees/{code}/documents/{documentId}` for the local download route.
- Permission keys `employees:read`, `employees:create`, `employees:update`, and `employees:delete` on the closed pharmacy catalog.

## Non-goals

- A login, a PIN, or a link to a pharmacy staff account.
- Payroll payment and attendance.
- A delete route, and removing a stored document.
- Reading `server_core`, `app-uploads/server-core/`, or `/medmate-repo/server-core/*`.

## Behavior

Every route uses `Access.pharmacy` for the caller's pharmacy. An approved owner is allowed. A staff member needs the key named below. Anyone else receives 403.

`employees:read` is required for the list, the one-person read, and both download routes. The detail is `Employees cannot be read`.

`employees:create` is required to create. The detail is `Employees cannot be created`.

`employees:update` is required for any change other than a transition to Inactive, including a photo, a document, or clearing the photo. The detail is `Employees cannot be updated`.

`employees:delete` is required only when status changes to Inactive, on create or on update. Keeping an already inactive status does not require it. Switching back to Active uses update. The detail is `Employees cannot be set inactive`. A request that needs a missing key changes nothing.

`GET /pharmacy/employees` returns that pharmacy's people ordered by code number, plus `workplace`: `name`, `tagline`, `address`, `city`, `state`, `phone` (the owner phone), and `logoUrl`. `logoUrl` is a 15-minute presigned GET when `APP_UPLOADS_BUCKET` is set, and otherwise `/pharmacies/{pharmacyId}/documents/logo`. A missing logo is null.

`GET /pharmacy/employees/{code}` returns the same workplace and one `employee`. A code outside this pharmacy is 404 with detail `Employee was not found`.

Each employee is `id` (the code), `name`, `position`, `department`, `phone`, `email`, `address`, `dob`, `joinedOn`, `employment`, `salary`, `status`, `pan`, `aadhaar`, `bankName`, `accountName`, `accountNumber`, `ifsc`, `upi`, `emergencyName`, `emergencyPhone`, `note`, `bloodGroup`, `photo`, and `documents`. `photo` is null or `{ fileName, contentType, url }`. Each document is `{ id, label, fileName, contentType, url }`. Responses include `url` and do not include the object key or the bytes. When the bucket is set, `url` is a 15-minute presigned GET. Otherwise the photo url is `/pharmacy/employees/{code}/photo` and a document url is `/pharmacy/employees/{code}/documents/{documentId}`.

The server assigns `id`. The first person in a pharmacy is `EMP-001`, then `EMP-002`. The number is one higher than the highest code for that pharmacy, padded to three digits through `EMP-999` and wider after that. A client-sent id is ignored. The code is not changed and is not reused. `(pharmacy_id, code)` is unique.

Create requires a trimmed name, a trimmed phone, and a position. The phone is not checked as an Indian mobile number and is not unique. Position is one of Owner, Manager, Pharmacist, Cashier, Delivery Executive, Store Helper, Accountant, Housekeeping. Employment is Full-time, Part-time, or Contract, default Full-time. Status is `active` or `inactive`, default `active`. Salary is a non-negative whole number of rupees, default 0. Blood group is empty or one of `A+`, `A−`, `B+`, `B−`, `AB+`, `AB−`, `O+`, `O−`. Dates are empty or `YYYY-MM-DD`. A present IFSC must match `^[A-Z]{4}0[A-Z0-9]{6}$` after uppercasing, and is stored uppercased. PAN, Aadhaar, email, address, department, bank fields, UPI, emergency contact, and notes are optional and are not format-checked. Blank optional text is stored as null.

An omitted field on update stays as stored. A present blank optional text clears it.

A photo is JPEG or PNG, up to 2 MiB. A document is JPEG, PNG, or PDF, up to 5 MiB. The label is one of Aadhaar card, PAN card, Pharmacist licence, Appointment letter, Educational certificate, Experience letter, Bank passbook, Address proof, Photograph, Other. Each document file needs one label. A new photo replaces the old object. `removePhoto: true` deletes it when no new photo is sent. Documents are appended.

Objects use the existing document store and the prefix `app-uploads/medmate-server`. The photo key is `employee-documents/{pharmacyId}/{code}/photo`. A document key is `employee-documents/{pharmacyId}/{code}/{documentId}`. Local and tests use the in-memory store.

| Status | Detail |
| --- | --- |
| 400 | `Name is required` |
| 400 | `Phone is required` |
| 400 | `Position is not recognised` |
| 400 | `Employment type is not recognised` |
| 400 | `Status is not recognised` |
| 400 | `Blood group is not recognised` |
| 400 | `Date is invalid` |
| 400 | `Salary must be zero or more` |
| 400 | `Invalid IFSC` |
| 400 | `File type is not allowed` |
| 400 | `File is too large` |
| 400 | `Document type is not recognised` |
| 400 | `Each document needs a type` |
| 403 | `Employees cannot be read` |
| 403 | `Employees cannot be created` |
| 403 | `Employees cannot be updated` |
| 403 | `Employees cannot be set inactive` |
| 404 | `Employee was not found` |

Create responds 201. Update and the reads respond 200.

## Acceptance criteria

- The first two people in a pharmacy are `EMP-001` and `EMP-002`. A staff member with `employees:read` can list them and cannot create one.
- A staff member with `employees:update` and not `employees:delete` cannot set an active person to Inactive, and the stored status stays active.
- A file that is not JPEG, PNG, or PDF is refused and is not stored.
- Another pharmacy's list does not include the person, and that pharmacy's read of the code is 404.

## Tests

- `EmployeeRulesTest` for the next code, the closed position and document lists, IFSC, and Inactive without `employees:delete`.
- `AccessTest` for the four new keys.
- `EmployeeFlowIT` for `EMP-001` then `EMP-002`, staff read, create refused without the key, Inactive refused without delete, a rejected file type, and a person from another pharmacy hidden.
- Bruno: `employees/list-employees.bru`, `employees/create-employee.bru`, and `employees/update-employee.bru`.

The module and the object prefix are [0011](../decisions/0011-employee-register.md).
