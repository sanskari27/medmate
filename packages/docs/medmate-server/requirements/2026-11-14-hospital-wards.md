# Hospital wards

## Context

An approved hospital keeps in-patient wards and the patients admitted to them. A bed is a label on the ward, not its own row. The dispensary screen is [IPD wards](../../dispensary/requirements/2026-11-14-hospital-wards.md). The module boundary is [0026](../decisions/0026-hospital-wards.md).

## Scope

- `GET /pharmacy/wards` and `GET /pharmacy/wards/{id}`.
- `POST /pharmacy/wards` and `PATCH /pharmacy/wards/{id}`.
- `GET /pharmacy/admissions` and `GET /pharmacy/admissions/{id}`.
- `POST /pharmacy/admissions`, `POST /pharmacy/admissions/{id}/transfer`, and `POST /pharmacy/admissions/{id}/discharge`.
- Permission keys `wards:read`, `wards:create`, `wards:update`, `wards:admit`, `wards:transfer`, and `wards:discharge` on the closed pharmacy catalog.

## Non-goals

- A delete route, a bed table, pagination, and a date-range report.
- A CRM patient row, a doctor id, and medicine bills.
- Reading `server_core`, `app-uploads/server-core/`, or `/medmate-repo/server-core/*`.

## Behavior

Every ward route uses `Access.pharmacy` for the caller's pharmacy, then reads the pharmacy row. An approved owner of a hospital is allowed. A staff member of a hospital needs the key named below. A caller whose pharmacy type is not `hospital` receives 403 with detail `Wards are only available for a hospital`, including an owner. Anyone else who fails the permission check receives the detail named below.

`wards:read` is required for both ward reads and both admission reads. The detail is `Wards cannot be read`.

`wards:create` is required to create a ward. The detail is `Wards cannot be created`.

`wards:update` is required for any ward change, including the daily rate, beds held, and maintenance. The detail is `Wards cannot be updated`.

`wards:admit` is required to admit. The detail is `A patient cannot be admitted`.

`wards:transfer` is required to transfer. The detail is `A patient cannot be transferred`.

`wards:discharge` is required to discharge. The detail is `A patient cannot be discharged`.

`GET /pharmacy/wards` returns that pharmacy's wards ordered by name, then code, ignoring case. The response is the full list. There is no `page` or `size`.

`GET /pharmacy/wards/{id}` returns one `ward`. An id outside this pharmacy is 404 with detail `Ward was not found`.

Each ward is `id`, `name`, `code`, `floor`, `category`, `beds`, `sister`, `dailyRate`, `bedsHeld`, `underMaintenance`, and `maintenanceNote`. `id` is a server UUID. A client-sent id on create is ignored. `floor`, `sister`, and `maintenanceNote` are null when blank.

`name` is required, trimmed, and at most 100 characters. `code` is required, trimmed, uppercased, at most 12 characters, and matches letters, digits, and hyphens. It is unique for that pharmacy ignoring case. It can change on update. A duplicate returns 409 with detail `Ward code is already in use`. Changing the code rewrites the bed label on every current admission in that ward, keeping the same bed number.

`category` is `General`, `ICU`, `Pediatric`, `Maternity`, `Surgical`, or `Private`. Omitted on create, it is `General`. `beds` is a whole number from 1 through 200. `bedsHeld` is a whole number from 0 through `beds`. Omitted on create, it is 0. Bed labels are `{code}-1` through `{code}-{beds}`. The last `bedsHeld` labels are held.

`dailyRate` is a decimal of at most two places, from `0.00` through `999999999999.99`. Omitted on create, it is `0.00`. The response is a two-decimal string. `underMaintenance` is a boolean. Omitted on create, it is false. `maintenanceNote` is optional and at most 500 characters.

A ward update that would drop an occupied bed number, or hold a bed number that is occupied, is 400. The detail is `Bed count is below the occupied beds` or `Held beds cover an occupied bed`. The row is unchanged.

On update, an omitted field stays as stored. JSON `null` clears `floor`, `sister`, and `maintenanceNote`.

`GET /pharmacy/admissions` returns current admissions, newest first. `GET /pharmacy/admissions/{id}` returns one `admission`. An id outside this pharmacy is 404 with detail `Admission was not found`.

Each admission is `id`, `name`, `uhid`, `phone`, `age`, `gender`, `wardId`, `wardName`, `bed`, `doctor`, `diagnosis`, `payerType`, `insurer`, `policyNo`, `admittedAt`, `status`, `days`, `dailyRate`, and `outstanding`. `admittedAt` is an ISO-8601 instant. `gender` is `Male`, `Female`, `Other`, or null. `payerType` is `self` or `insurance`. `phone`, `age`, `doctor`, `diagnosis`, `insurer`, and `policyNo` are null when blank. While the patient is admitted, `dailyRate` is the current rate of their ward and `outstanding` is that rate times `days`. `days` is at least 1, the ceiling of elapsed 24-hour periods since `admittedAt`. After discharge, `dailyRate` and `outstanding` are the rate and amount stored at discharge.

Admit requires `name` (at most 100), `uhid` (at most 40), `wardId`, and `bed`. `uhid` is unique among current admissions in that pharmacy, ignoring case. A duplicate is 409 with detail `This patient is already admitted`. The same UHID can be admitted again after discharge. `phone` is at most 20 characters. `age` is a whole number from 0 through 150. `doctor` is at most 100 characters. `diagnosis` is at most 500. `insurer` is required when `payerType` is `insurance`, and is at most 100. `policyNo` is at most 60. Omitted `payerType` is `self`.

The bed must be a label of that ward, must not be held, and must not already have a current admission. Otherwise the detail is `Bed is not free` or `Bed is held for maintenance`. A ward under maintenance refuses a new admission with detail `Ward is under maintenance`.

Transfer body is `wardId` and `bed`. The stay keeps `admittedAt`. Moving inside a ward that is under maintenance is allowed. Moving into a different ward that is under maintenance is 400 with detail `Ward is under maintenance`. The destination bed follows the same free and held rules. A discharged admission is 400 with detail `This patient is already discharged`.

Discharge settles the open ward charge and frees the bed. The amount is the current rate of the ward the patient is in, times `days`, for the whole stay. A rate edit or a transfer before discharge changes that whole amount. When the amount is `0.00`, `payMode` is omitted and nothing is collected. When the amount is above zero, `payMode` is required and is `cash`, `upi`, `card`, or `insurance`. A missing mode is 400 with detail `Pay mode is required`. The discharge stores the amount, the rate, the mode, and the time. A later rate edit does not change it.

| Status | Detail |
| --- | --- |
| 400 | `Ward name is required` |
| 400 | `Ward name is too long` |
| 400 | `Ward code is required` |
| 400 | `Ward code is too long` |
| 400 | `Ward code is invalid` |
| 400 | `Ward category is not recognised` |
| 400 | `Bed count is invalid` |
| 400 | `Beds held is invalid` |
| 400 | `Daily rate is invalid` |
| 400 | `Floor is too long` |
| 400 | `Nurse name is too long` |
| 400 | `Maintenance note is too long` |
| 400 | `Maintenance flag is not recognised` |
| 400 | `Bed count is below the occupied beds` |
| 400 | `Held beds cover an occupied bed` |
| 400 | `Patient name is required` |
| 400 | `Patient name is too long` |
| 400 | `UHID is required` |
| 400 | `UHID is too long` |
| 400 | `Phone is too long` |
| 400 | `Age is invalid` |
| 400 | `Gender is not recognised` |
| 400 | `Bed is required` |
| 400 | `Bed is not free` |
| 400 | `Bed is held for maintenance` |
| 400 | `Ward is under maintenance` |
| 400 | `Ward was not found` |
| 400 | `Doctor name is too long` |
| 400 | `Diagnosis is too long` |
| 400 | `Payer is not recognised` |
| 400 | `Insurer is required` |
| 400 | `Insurer is too long` |
| 400 | `Policy number is too long` |
| 400 | `Pay mode is required` |
| 400 | `Pay mode is not recognised` |
| 400 | `This patient is already discharged` |
| 403 | `Wards are only available for a hospital` |
| 403 | `Wards cannot be read` |
| 403 | `Wards cannot be created` |
| 403 | `Wards cannot be updated` |
| 403 | `A patient cannot be admitted` |
| 403 | `A patient cannot be transferred` |
| 403 | `A patient cannot be discharged` |
| 404 | `Ward was not found` |
| 404 | `Admission was not found` |
| 409 | `Ward code is already in use` |
| 409 | `This patient is already admitted` |

Create responds 201. Update, transfer, discharge, and the reads respond 200.

## Acceptance criteria

- A hospital owner creates a ward, admits a patient to a free bed, transfers them, and discharges them for the current rate times at least one day.
- The last held bed cannot be assigned. A ward under maintenance cannot take a new admission, and a patient already there can move to another free bed in that ward.
- A second current admission with the same UHID is 409 and is not stored.
- A retail pharmacy owner receives 403 `Wards are only available for a hospital`.
- A hospital staff member with only `wards:read` can list wards and cannot admit.

## Tests

- `WardRulesTest` for the rate times days, held last labels, a maintenance block, a bed count that would drop an occupied bed, and the discharge amount.
- `WardsFlowIT` for a hospital create, admit, transfer, discharge, a held bed, a retail 403, and a staff member missing `wards:admit`.
- Bruno: `wards/list-wards.bru`, `wards/create-ward.bru`, `wards/update-ward.bru`, `wards/admit-patient.bru`, `wards/transfer-patient.bru`, and `wards/discharge-patient.bru`.

The module and the migration are [0026](../decisions/0026-hospital-wards.md).
