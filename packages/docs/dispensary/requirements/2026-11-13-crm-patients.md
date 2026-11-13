# CRM - Patients

## Context

Staff work from one menu instead of the pharmacy app's Customers, Credit · Khata, and CRM · Patients screens. The pharmacy app stays untouched and is not imported. The API is [Pharmacy CRM](../../medmate-server/requirements/2026-11-13-pharmacy-crm.md).

## Scope

- A Counter item, CRM - Patients, immediately after Sales, for an approved owner and for pharmacy staff who hold `patients:read`.
- `/patients`.
- One directory, task dialogs on each row, and the Reminders, Loyalty, Campaigns, Feedback, and Analytics tabs.
- Cash or Credit on the billing counter. A credit bill is labelled on khata after it posts.
- The Manage Users dialog gains CRM · Patients under Counter, after Sales.

## Non-goals

- A second patient directory for khata.
- UPI or card as a bill pay mode. Those stay disabled on the counter and remain available when recording a repayment.
- Sending a message from the server. WhatsApp and SMS open on this device.
- Prefilling Billing from the Bill action.
- The admin portal, the pharmacy app, and every dispensary screen other than Billing's pay choice and this menu.

## Behavior

CRM - Patients sits under Counter, immediately after Sales. The shell title is CRM - Patients and the subtitle is `Segments, reminders, loyalty and khata`. An approved owner always sees it. A staff member sees it only with `patients:read`. Update alone leaves the item hidden, and `/patients` sends that person to the dashboard.

The page loads `GET /pharmacy/patients` through the portal API client. Tabs, in order, are Patients, Reminders, Loyalty, Campaigns, Feedback, and Analytics.

Patients shows, in order, the customer stats (Customers, Lifetime sales, Repeat customers, On chronic Rx, Credit outstanding), then the CRM stats this API fills (Active 30d, At-risk, Refills due, Loyalty points, Avg rating), then the three aging buckets (0–30 days, 31–60 days, 60+ days), then search, sort, and segment, then the table. Search sends `q`. Sort is Lifetime, Orders, or Recent. Segment is All, High value, Lapsed / at-risk, New, On credit, or Regular. The cards and aging buckets stay the unfiltered summary. Columns are Patient, Phone, Orders, Lifetime, Last visit, Segment, Credit due, and Actions. Empty copy is `No patients yet.` A query with no match shows `No patients match your search.` The list uses the shared page bar.

Actions, in order, are History, Credit, Profile, Remind, Loyalty, Feedback, and Bill. Bill navigates to `/billing` and does not change the cart. Each other action opens one dialog for that patient from `GET /pharmacy/patients/{phone}`.

History lists purchases, newest first: invoice number, date, pay mode, units, and amount. Credit lists the ledger, then Half and Full, the amount, the mode (Cash, UPI, Card), an optional note, and Collect. Collect is hidden without `patients:update`. The outstanding and a WhatsApp collect link stay visible. A failure shows the problem detail. Profile edits age, gender, blood group, date of birth, address, conditions, allergies, note, and consent. Save is hidden without `patients:update`. Remind chooses kind and channel, saves, then opens WhatsApp or SMS for that phone. Loyalty shows available points and the tier note `1 point per ₹100`. Redeem saves and is hidden without `patients:update` or when no points remain. Feedback sets rating, NPS, and comment.

Excel and PDF sit on the Patients tab and are hidden without `patients:update`. They call `GET /pharmacy/patients/export` with the current search, sort, and segment, then download a CSV and a text PDF of name, phone, orders, units, lifetime, and points.

Reminders lists stored reminders, newest first, and the refill count from the summary, which is zero. Loyalty lists the analytics leaders' points when opened from the patient rows already loaded is not required: it shows available points for the patients on the current page and the tier note. Campaigns is a form (segment, channel, offer, message) and the saved list. Save posts the campaign, then opens WhatsApp or SMS for `first` when `first` is present. Feedback is a form plus the saved list. Analytics shows average lifetime value, retention, churn risk, campaign sales, and the RFM leader table.

Billing keeps Cash, UPI, and Card. Credit is added as a choice that can be selected. UPI and Card stay disabled. Credit posts `payMode: "credit"` with the name and phone already on the counter. The pay-mode readout says Credit, and the note says the amount is on khata and settled later. The posted invoice title is `Invoice {number} · on khata` when `payMode` is `credit`.

The permission dialog lists Counter before Management. CRM · Patients follows Sales and has Read and Update. The keys are `patients:read` and `patients:update`. The access count is `n / 37`.

## Acceptance criteria

- An owner sees Billing, then Sales, then CRM - Patients, under Counter. A staff member with `patients:read` sees the item. A staff member with only `patients:update` who opens `/patients` lands on the dashboard.
- History, Credit, Profile, Remind, Loyalty, and Feedback each open their dialog. Bill goes to Billing. Excel and Collect are absent without `patients:update`.
- Choosing Credit and charging sends `payMode: "credit"`. The posted title includes `on khata`.
- The Manage Users dialog includes CRM · Patients Read and Update. The access count uses 37.

## Tests

- `patientsView.test.ts` for the export rows and the collect link.
- `PatientsPage.test.tsx` for each row action, Bill leaving the cart alone, and Excel hidden without `patients:update`.
- `BillingPage.test.tsx` for a credit charge posting `payMode: "credit"`.
- `catalog.test.ts` and `UsersPage.test.tsx` for `n / 37` and the CRM · Patients rows.
- `AppRouter.test.tsx` for CRM - Patients after Sales, a staff member with `patients:read`, and a staff member without it sent from `/patients` to the dashboard.
