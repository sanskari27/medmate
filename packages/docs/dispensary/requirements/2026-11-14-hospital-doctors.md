# Hospital doctors

## Context

A hospital keeps a doctor directory that is separate from Employees and from Manage Users. The section is hidden for a retail pharmacy. The pharmacy app stays untouched and is not imported. The API is [Hospital doctors](../../medmate-server/requirements/2026-11-14-hospital-doctors.md).

## Scope

- A Hospital section immediately after Counter, with one item, Doctors, for an approved hospital owner and for hospital staff who hold `doctors:read`.
- `/doctors`.
- Creating and editing a doctor, uploading a photo and documents, consultation windows, and Active or Inactive.
- `pharmacyType` on the signed-in account.
- The Manage Users dialog gains Hospital, then Doctors, after Counter.

## Non-goals

- Associated patients and prescription history.
- A second workplace, a Doctor ID field, deleting a doctor, and removing an uploaded document.
- Pagination.
- The admin portal, the pharmacy app, and every dispensary screen other than the sidebar, this page, and Manage Users.

## Behavior

The nav label is Doctors. The shell title is Doctors and the subtitle is `Registration, consultation and documents`. The Hospital heading sits on this item, immediately after CRM - Patients and before Catalogue. An approved owner of a pharmacy whose `pharmacyType` is `hospital` always sees it. Hospital staff see it only with `doctors:read`. Create or update alone leave the item hidden. A retail pharmacy, and a hospital staff member without `doctors:read` who opens `/doctors`, land on the dashboard.

The page loads `GET /pharmacy/doctors` through the portal API client. The controls, in order, are the status filter (All, Active, Inactive), the search field (`Search name, code, mobile…`), and Add doctor. The table follows: Doctor, Code, Specialization, Mobile, Relationship, and Status. The Doctor cell shows the photo when one is stored, then the display name. Search matches display name, first name, last name, code, mobile, and specialization, ignoring case. The status filter runs on the loaded list. Empty copy is `No doctors yet.` A search or filter with no row shows `No doctors match your search.`

Add doctor and Edit open the form on the same page. The sections, in order, are Basic, Professional, Contact, Workplace, Consultation, Relationship, and Documents. A new doctor defaults to Active and one consultation window of Offline, Monday, 09:00–13:00, and fee 0. The server id is not shown. Doctor Code is an input. Save stays disabled until the required fields are present and the window times and fee are valid.

`doctors:create` shows Add doctor. `doctors:update` saves the form, including status, windows, the photo, new documents, and verification status. A failed save shows the problem detail on the form.

The permission dialog lists Counter, then Hospital, then Management. Doctors has Read, Create, and Update. The keys are `doctors:read`, `doctors:create`, and `doctors:update`. The access count is `n / 44`. The rows are shown for every pharmacy.

## Acceptance criteria

- A hospital owner sees Counter, then Hospital, then Doctors, before Catalogue. A retail owner does not see Hospital. A hospital staff member with `doctors:read` sees Doctors. A hospital staff member without that key who opens `/doctors` lands on the dashboard.
- The dialog has the three doctor toggles under Hospital, after Counter. Add is absent without create. The form is absent without update. Save stays disabled until the required fields are valid.
- The form has no Doctor ID field and no control that removes a stored document.

## Tests

- `model.test.ts` for the draft and the search filter.
- `DoctorsPage.test.tsx` for the sections, a window, document status, Add hidden without `doctors:create`, and editing hidden without `doctors:update`.
- `catalog.test.ts` and `UsersPage.test.tsx` for Hospital after Counter and `n / 44`.
- `AppRouter.test.tsx` for Doctors after Counter, a retail pharmacy, a hospital owner, and a hospital staff member without `doctors:read` sent from `/doctors` to the dashboard.
