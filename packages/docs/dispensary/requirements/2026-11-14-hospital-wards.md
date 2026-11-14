# IPD wards

## Context

A hospital runs in-patient wards from one screen. The screen keeps the pharmacy app's IPD · Wards layout: the six counts, the Bed map and Admissions tabs, the ward cards and bed grid, and the three dialogs. The pharmacy app stays untouched and is not imported. The API is [Hospital wards](../../medmate-server/requirements/2026-11-14-hospital-wards.md).

## Scope

- An IPD · Wards item in the Hospital section, immediately after Departments, for an approved hospital owner and for hospital staff who hold `wards:read`.
- `/wards`.
- Creating and editing a ward, including the daily rate, beds held, and maintenance, inside Manage wards.
- Admitting a patient, transferring them, and discharging them for the ward charge.
- The Manage Users dialog gains Wards under Hospital, after Departments.

## Non-goals

- Deleting a ward, a separate bed record, a reports tab, a date range, and an export.
- Creating a CRM patient, billing medicines, and the Bill medicines action.
- The admin portal, the pharmacy app, and every dispensary screen other than the sidebar, this page, and Manage Users.

## Behavior

The nav label is IPD · Wards. The shell title is IPD · Wards and the subtitle is `In-patient wards, beds & dispensing`. The item sits under Hospital, immediately after Departments. An approved owner of a pharmacy whose `pharmacyType` is `hospital` always sees it. Hospital staff see it only with `wards:read`. Any other ward key alone leaves the item hidden. A retail pharmacy, and a hospital staff member without `wards:read` who opens `/wards`, land on the dashboard.

The page loads `GET /pharmacy/wards` and `GET /pharmacy/admissions` through the portal API client. The controls, in order, are the six counts, then the toolbar, then either the bed map or the admissions table.

The counts are Wards, Total beds, Occupied, Free, Occupancy, and Admitted. Free is assignable beds: capacity minus beds held minus current admissions. Occupancy is occupied divided by total beds, rounded, with a percent sign. Admitted is the current admission count.

The toolbar is Bed map, Admissions with the current count, then Manage wards, then Admit patient. Bed map is selected first. Manage wards is shown for `wards:create` or `wards:update`. Admit patient is shown for `wards:admit`.

Each ward card shows the name, then `{code} · {floor} · {sister}`, the category pill, `{occupied}/{beds} beds occupied`, the percent, a Beds occupied progress bar, and the bed grid. Category colours match the pharmacy screen: ICU rose, General gray, Surgical blue, Pediatric amber, Maternity teal, Private wash. A ward under maintenance shows a Maintenance pill and the note. The last held labels read Held and cannot be chosen. An occupied bed shows the patient's first name. A free bed shows + Free. Choosing an occupied bed opens the admission. Choosing a free bed opens Admit patient with that ward and bed, and only when the caller holds `wards:admit` and the ward is not under maintenance.

The admissions table heading is Admitted patients. The search placeholder is `Patient, UHID, bed…`. Columns are Patient, UHID, Ward · Bed, Doctor, Payer, Admitted, Outstanding, and an arrow. Empty copy is `No admitted patients.` A row opens the admission. Payer is the insurer name, or Insurance, or Self-pay. Admitted is `{days}d · {time ago}`. Outstanding is the ward charge, rose when it is above zero.

Manage wards & beds is the pharmacy dialog. The table columns are Ward name, Code, Floor, Category, Beds, Nurse in-charge, Daily rate, Held, and Maintenance. A caller with `wards:update` edits a cell and the save runs when the cell loses focus, and only when the value changed. A caller without update sees the values as text. Add a ward follows, for `wards:create`. The fields, in order, are Ward name, Code / bed prefix, Floor, Category, Bed capacity, Nurse in-charge, Daily rate, Beds held, and Under maintenance with a note. A new ward defaults to General, 10 beds, rate 0.00, nothing held, and not under maintenance. The add button reads `Add ward · {beds} beds ({code}-1…{code}-{beds})` and stays disabled until the name and code are present. The footer button is Done. A failed save shows the problem detail in the dialog.

Admit patient is the pharmacy dialog. The fields, in order, are Patient name, Patient ID / UHID, Phone, Age, Gender, Ward, Bed, Attending doctor, Diagnosis / reason, and Payer. Gender is Male, Female, or Other. The ward option reads `{name} ({n} free)`. The suggested UHID is `UHID-{100400 + admissions + 1}`. Payer is Self-pay or Insurance / TPA. Insurance shows Insurer / TPA and Policy / claim no. The insurer list is the pharmacy list, starting with Star Health (Medi Assist). Attending doctor is a select of active doctor display names when the caller holds `doctors:read` or is the owner, plus a blank choice. The stored value is that name. Cancel, then Admit to the chosen bed. Admit stays disabled until the name, UHID, ward, and bed are present. Saving opens that admission.

The admission dialog title is the patient name and the bed. The line under it is `{uhid} · {ward} · admitted {days}d ago` and the admitted time. The facts are Attending, Diagnosis, Payer, and Policy no. or Phone. Four counts follow: Days, Daily rate, Ward charge, and Outstanding. Transfer sits above Final bill & discharge and is shown for `wards:transfer`. It asks for a ward and a free bed, including another free bed in a ward that is under maintenance when the patient is already there. Final bill & discharge shows the amount due. Above zero, the pay choices are Cash, UPI, Card, and Insurance / TPA, then `Settle {amount} ({mode}) & discharge`. At zero, the button is `Discharge patient · free bed {bed}`. Discharge is shown for `wards:discharge`. A failed save shows the problem detail in the dialog.

The permission dialog lists Counter, then Hospital, then Management. Under Hospital, Doctors stays first, Departments follows, and Wards follows Departments, with Read, Create, Update, Admit, Transfer, and Discharge. The keys are `wards:read`, `wards:create`, `wards:update`, `wards:admit`, `wards:transfer`, and `wards:discharge`. The access count is `n / 53`. The rows are shown for every pharmacy.

## Acceptance criteria

- A hospital owner sees Doctors, then Departments, then IPD · Wards, under Hospital. A retail owner does not see Hospital. A hospital staff member with `wards:read` sees IPD · Wards. A hospital staff member without that key who opens `/wards` lands on the dashboard.
- The six counts, Bed map, Admissions, ward cards, and bed labels are on the page. Held beds read Held. Manage wards is absent without create and update. Admit patient is absent without `wards:admit`. Transfer and discharge are absent without those keys.
- The dialog has the six ward toggles under Hospital, after Departments.

## Tests

- `model.test.ts` for bed labels, the last held labels, free beds, days, and occupancy.
- `WardsPage.test.tsx` for the six counts, Manage wards hidden without create, Admit hidden without `wards:admit`, and transfer and discharge hidden without those keys.
- `catalog.test.ts` and `UsersPage.test.tsx` for Wards after Departments and `n / 53`.
- `AppRouter.test.tsx` for IPD · Wards after Departments, a retail pharmacy, and a hospital staff member without `wards:read` sent from `/wards` to the dashboard.
