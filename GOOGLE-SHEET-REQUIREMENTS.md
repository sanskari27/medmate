# MedMate — Google Sheet: Requirements & Development Status

The tracker of record for MedMate requirements and development status.

> **The live sheet is created and populated.**
> **https://docs.google.com/spreadsheets/d/19Ngyy5OJtdjqLI7Z0hP-LBRZQxF8cpBBMpwcsX6XGgM/edit**
> It holds all 77 stories with the status of each one, and it is updated as
> stories are completed. The payload in §1 below is the source used to write it,
> and is kept here so the sheet can be rebuilt or audited.

**Sheet structure — 3 columns, nothing more:**

| Column | Contents |
|---|---|
| **ID** | Feature identifier (`F-101` … `F-520`), stable across renames |
| **Story** | One Jira-style user story per feature — a single heading, no description, no extra fields |
| **Status** | Exactly one of: **Not Started**, **Dev in Progress**, **Completed** |

---

## 1. Create the Sheet in 30 seconds

The sheet is already created and filled — see the link at the top. If you ever
need to rebuild it, here is how.

**Steps**

1. Go to <https://sheets.new> and create a blank spreadsheet. Name it
   `MedMate - Requirements & Development Status`.
2. Open the **ID** cell (A1) so it is selected, and paste the block below.
   Google Sheets splits it into three columns automatically (tab-separated).
3. Add the dropdown to the Status column:
   * Select column **C** → **Data ▸ Data validation ▸ Criteria: List of items**
   * Items: `Not Started, Dev in Progress, Completed`
   * Tick **Show dropdown in cell** → **Save**.
4. Freeze the header: **View ▾ → Freeze ▾ → 1 row**.

> **Note on the dropdown.** The Status column already contains only valid values,
> and the dropdown is a convenience that stops typos. It is the one step of the
> setup that still needs a click: open the sheet, select column C, then
> **Data ▸ Data validation ▸ List of items**.

### Paste block — copy everything between the lines

```tsv
ID	Story	Status
F-101	As a staff member, I want to sign in with my mobile number and a PIN, so that my actions are recorded against my name.	Dev in Progress
F-102	As an owner, I want one permission model to drive both the menu and the API, so that what staff can see always matches what staff can do.	Dev in Progress
F-103	As a front desk receptionist, I want patient records to hide clinical details, so that I cannot open anything that is not mine to see.	Not Started
F-104	As a clinic administrator, I want clinical fields removed from patient and queue lists, so that my access matches my role.	Not Started
F-105	As a clinic owner, I want every sign-in, record open and payment logged, so that I can prove who did what.	Dev in Progress
F-106	As a clinic owner, I want shared tablets to lock when left unattended, so that patient data is never left open.	Dev in Progress
F-107	As a clinic owner, I want one person retrying to never lock out the rest of the clinic, so that the front desk always keeps working.	Not Started
F-108	As a doctor, I want to take over a patient assigned to a colleague, so that I am never blocked mid-consultation.	Not Started
F-109	As a salaried doctor, I want to see only my own patients and earnings, so that other doctors records stay private.	Not Started
F-201	As a receptionist, I want to turn any tablet into a patient check-in kiosk, so that patients check in without queueing at my desk.	Dev in Progress
F-202	As a patient, I want to use the kiosk in my own language, so that I can check in without needing help.	Dev in Progress
F-203	As a patient, I want to confirm my mobile with a code, so that my check-in is linked to the right record.	Completed
F-204	As a patient, I want to enter my name, age, sex and allergies once at the kiosk, so that nobody has to type it again.	Dev in Progress
F-205	As a patient, I want to see the doctors who are actually in clinic now, so that I join the right queue.	Not Started
F-206	As a patient, I want to see the fee and get a token before paying, so that I can queue now and pay at the desk.	Completed
F-207	As a patient, I want to check in by scanning a code with my phone, so that I do not have to touch the screen.	Dev in Progress
F-208	As a patient, I want the kiosk to keep what I typed if I pause, so that I do not have to start again.	Not Started
F-209	As a patient using a screen reader, I want the kiosk fully operable without a mouse, so that I can check in independently.	Not Started
F-210	As a patient, I want to book a doctor online without making an account, so that booking takes a minute.	Completed
F-211	As a clinic, I want the public booking API to reveal only my own clinic, so that other clinics data is never exposed.	Completed
F-212	As a patient, I want to link my health ID and see exactly what is shared, so that my records travel safely.	Not Started
F-213	As a patient, I want to see my appointments, reports and dues on my phone, so that I stop calling the clinic.	Not Started
F-214	As a receptionist, I want duplicate patient records flagged and mergeable, so that a patient does not end up with two histories.	Not Started
F-301	As a doctor, I want my queue ordered by urgency and wait time, so that the sickest patient is seen first.	Completed
F-302	As a nurse, I want to record vitals once at the station, so that the doctor sees them without asking.	Dev in Progress
F-303	As a doctor, I want emergency and red-flag patients surfaced immediately, so that I do not miss a critical case.	Completed
F-304	As a nurse, I want to route a patient to the right doctor, so that they are seen by someone equipped for their problem.	Dev in Progress
F-305	As a doctor, I want the patient key facts before I type anything, so that I can start the consult in seconds.	Completed
F-306	As a doctor, I want one request for the whole clinical brief, so that the summary loads instantly.	Dev in Progress
F-307	As a doctor, I want a seven-step consultation form, so that I record a complete visit in one flow.	Dev in Progress
F-308	As a doctor, I want to tap examination findings by body system, so that I do not type during the consult.	Completed
F-309	As a doctor, I want to search and code my diagnosis, so that reports are accurate and billable.	Dev in Progress
F-310	As a doctor, I want to search any brand or salt, so that I prescribe what is actually stocked.	Dev in Progress
F-311	As a doctor, I want to be warned about allergies and drug interactions before signing, so that I cannot prescribe something harmful.	Not Started
F-312	As a doctor, I want to order tests from the consultation, so that the lab gets the order without a phone call.	Dev in Progress
F-313	As a doctor, I want my common advice lines remembered, so that writing advice takes one tap.	Dev in Progress
F-314	As a doctor, I want to book the follow-up inside the consultation, so that the patient leaves with a date.	Completed
F-315	As a doctor, I want to save a repeated protocol and re-apply it, so that common visits take less typing.	Dev in Progress
F-316	As a doctor, I want to sign prescriptions digitally, so that they are legally valid and reach the patient instantly.	Dev in Progress
F-317	As a hospital or lab, I want records as standard FHIR data, so that any compliant system can read them.	Not Started
F-318	As a doctor, I want referrals and colleague handovers in one inbox, so that nothing waiting on me is missed.	Dev in Progress
F-319	As a doctor, I want abnormal results flagged and filed to the visit, so that I act on them quickly.	Dev in Progress
F-320	As a doctor, I want to mark a no-show, so that my clinic no-show rate is accurate.	Dev in Progress
F-321	As a doctor, I want the consultation drafted from the conversation, so that I spend more time with the patient.	Not Started
F-322	As a doctor, I want to issue a certificate from the patient record, so that I do not retype it.	Dev in Progress
F-323	As a doctor, I want to run a video consult that produces the same signed prescription, so that online patients get equal care.	Dev in Progress
F-401	As a receptionist, I want each finished consultation to arrive as a task list, so that I print, collect and book without re-typing.	Completed
F-402	As a receptionist, I want to take UPI, cash or card against an open bill, so that checkout is quick and the receipt is automatic.	Dev in Progress
F-403	As a clinic owner, I want GST-correct invoices with a reason for every discount, so that my books stand up.	Dev in Progress
F-404	As a receptionist, I want to refund a paid bill with a reason, so that the day totals stay correct.	Dev in Progress
F-405	As a receptionist, I want to close the day and be told if the cash does not match, so that I find mistakes before I leave.	Dev in Progress
F-406	As a receptionist, I want a day and week view I can check arrivals in from, so that I know who is coming.	Dev in Progress
F-407	As a patient, I want a text when my token is called and when my prescription is ready, so that I do not keep asking.	Dev in Progress
F-408	As a patient, I want my reminders, prescriptions and reports on WhatsApp, so that I receive them where I actually read them.	Not Started
F-409	As a clinic owner, I want return-visit reminders and a waitlist, so that slots fill and no-shows fall.	Not Started
F-410	As a clinic owner, I want to sell treatment packages paid in instalments, so that chronic patients stay with us.	Not Started
F-411	As a clinic, I want to bill a TPA or corporate account separately from the patient, so that we can win corporate panels.	Not Started
F-501	As a clinic owner, I want reports on money, patients and waiting times, so that I know how the day is going.	Dev in Progress
F-502	As a clinic owner, I want the app to tell me what needs attention, so that I act instead of reading dashboards.	Dev in Progress
F-503	As a clinic owner, I want to download everything about my clinic, so that I am never trapped if I leave.	Dev in Progress
F-504	As an owner, I want to add doctors by their government ID and set their fees and room, so that the system stays accurate.	Dev in Progress
F-505	As an owner, I want to see who has set their PIN and who has been active, so that access is always clean.	Dev in Progress
F-506	As an owner, I want to manage branches and rooms, so that a multi-branch clinic works from one place.	Dev in Progress
F-507	As an owner, I want to set my clinic details, letterhead and data location, so that documents are correct and I know where data lives.	Dev in Progress
F-508	As an owner, I want to see my plan, usage and limits, so that I know what I can grow into.	Dev in Progress
F-509	As an owner, I want to see every message sent to patients and why it failed, so that I can chase delivery.	Dev in Progress
F-510	As a new clinic, I want to be running on MedMate within ten minutes, so that I can start seeing patients.	Dev in Progress
F-511	As a clinic, I want the terms and data agreement to be final and accurate, so that my obligations are clear.	Dev in Progress
F-512	As a clinic owner, I want to export the activity log, so that I can answer a compliance question.	Dev in Progress
F-513	As a Kannada-speaking nurse, I want the station screens in my language, so that I can work without translating.	Not Started
F-514	As a receptionist, I want to open the app straight to my desk, so that I do not choose my next action every time.	Not Started
F-515	As a doctor, I want to find any patient from anywhere in one keystroke, so that I can retrieve a record instantly.	Not Started
F-516	As a patient, I want to be told when my prescription is ready, so that I stop waiting in the clinic.	Dev in Progress
F-517	As a nurse on a slow tablet, I want the app to load fast, so that vitals are never delayed by waiting for pages.	Dev in Progress
F-518	As a doctor on the move, I want the station screens on my phone, so that I can consult away from the desk.	Not Started
F-519	As a clinic, I want my data backed up and stored in India, so that records are safe and compliant.	Dev in Progress
F-520	As a product owner, I want to see which features are used and collect feedback in-app, so that I build what clinics need.	Not Started
```

---

## 2. Create the Sheet programmatically instead (optional)

If you would rather have it created and kept in sync automatically, run this once from
a terminal where `gcloud` is authenticated, or paste it into **Extensions ▸ Apps Script**
in any spreadsheet and press **Run**:

```javascript
/** Creates the MedMate requirements sheet. Run once. */
const SHEET_NAME = 'MedMate — Requirements & Development Status';
const HEADER = ['ID', 'Story', 'Status'];
const STATUSES = ['Not Started', 'Dev in Progress', 'Completed'];

// Paste the TSV payload between the markers into this string.
const TSV = `ID	Story	Status
F-101	As a staff member, I want to sign in with my mobile number and a PIN, so that my actions are recorded against my name.	Dev in Progress
F-102	As an owner, I want one permission model to drive both the menu and the API, so that what staff can see always matches what staff can do.	Dev in Progress
F-103	As a front desk receptionist, I want patient records to hide clinical details, so that I cannot open anything that is not mine to see.	Not Started
F-104	As a clinic administrator, I want clinical fields removed from patient and queue lists, so that my access matches my role.	Not Started
F-105	As a clinic owner, I want every sign-in, record open and payment logged, so that I can prove who did what.	Dev in Progress
F-106	As a clinic owner, I want shared tablets to lock when left unattended, so that patient data is never left open.	Dev in Progress
F-107	As a clinic owner, I want one person retrying to never lock out the rest of the clinic, so that the front desk always keeps working.	Not Started
F-108	As a doctor, I want to take over a patient assigned to a colleague, so that I am never blocked mid-consultation.	Not Started
F-109	As a salaried doctor, I want to see only my own patients and earnings, so that other doctors records stay private.	Not Started
F-201	As a receptionist, I want to turn any tablet into a patient check-in kiosk, so that patients check in without queueing at my desk.	Dev in Progress
F-202	As a patient, I want to use the kiosk in my own language, so that I can check in without needing help.	Dev in Progress
F-203	As a patient, I want to confirm my mobile with a code, so that my check-in is linked to the right record.	Completed
F-204	As a patient, I want to enter my name, age, sex and allergies once at the kiosk, so that nobody has to type it again.	Dev in Progress
F-205	As a patient, I want to see the doctors who are actually in clinic now, so that I join the right queue.	Not Started
F-206	As a patient, I want to see the fee and get a token before paying, so that I can queue now and pay at the desk.	Completed
F-207	As a patient, I want to check in by scanning a code with my phone, so that I do not have to touch the screen.	Dev in Progress
F-208	As a patient, I want the kiosk to keep what I typed if I pause, so that I do not have to start again.	Not Started
F-209	As a patient using a screen reader, I want the kiosk fully operable without a mouse, so that I can check in independently.	Not Started
F-210	As a patient, I want to book a doctor online without making an account, so that booking takes a minute.	Completed
F-211	As a clinic, I want the public booking API to reveal only my own clinic, so that other clinics data is never exposed.	Completed
F-212	As a patient, I want to link my health ID and see exactly what is shared, so that my records travel safely.	Not Started
F-213	As a patient, I want to see my appointments, reports and dues on my phone, so that I stop calling the clinic.	Not Started
F-214	As a receptionist, I want duplicate patient records flagged and mergeable, so that a patient does not end up with two histories.	Not Started
F-301	As a doctor, I want my queue ordered by urgency and wait time, so that the sickest patient is seen first.	Completed
F-302	As a nurse, I want to record vitals once at the station, so that the doctor sees them without asking.	Dev in Progress
F-303	As a doctor, I want emergency and red-flag patients surfaced immediately, so that I do not miss a critical case.	Completed
F-304	As a nurse, I want to route a patient to the right doctor, so that they are seen by someone equipped for their problem.	Dev in Progress
F-305	As a doctor, I want the patient key facts before I type anything, so that I can start the consult in seconds.	Completed
F-306	As a doctor, I want one request for the whole clinical brief, so that the summary loads instantly.	Dev in Progress
F-307	As a doctor, I want a seven-step consultation form, so that I record a complete visit in one flow.	Dev in Progress
F-308	As a doctor, I want to tap examination findings by body system, so that I do not type during the consult.	Completed
F-309	As a doctor, I want to search and code my diagnosis, so that reports are accurate and billable.	Dev in Progress
F-310	As a doctor, I want to search any brand or salt, so that I prescribe what is actually stocked.	Dev in Progress
F-311	As a doctor, I want to be warned about allergies and drug interactions before signing, so that I cannot prescribe something harmful.	Not Started
F-312	As a doctor, I want to order tests from the consultation, so that the lab gets the order without a phone call.	Dev in Progress
F-313	As a doctor, I want my common advice lines remembered, so that writing advice takes one tap.	Dev in Progress
F-314	As a doctor, I want to book the follow-up inside the consultation, so that the patient leaves with a date.	Completed
F-315	As a doctor, I want to save a repeated protocol and re-apply it, so that common visits take less typing.	Dev in Progress
F-316	As a doctor, I want to sign prescriptions digitally, so that they are legally valid and reach the patient instantly.	Dev in Progress
F-317	As a hospital or lab, I want records as standard FHIR data, so that any compliant system can read them.	Not Started
F-318	As a doctor, I want referrals and colleague handovers in one inbox, so that nothing waiting on me is missed.	Dev in Progress
F-319	As a doctor, I want abnormal results flagged and filed to the visit, so that I act on them quickly.	Dev in Progress
F-320	As a doctor, I want to mark a no-show, so that my clinic no-show rate is accurate.	Dev in Progress
F-321	As a doctor, I want the consultation drafted from the conversation, so that I spend more time with the patient.	Not Started
F-322	As a doctor, I want to issue a certificate from the patient record, so that I do not retype it.	Dev in Progress
F-323	As a doctor, I want to run a video consult that produces the same signed prescription, so that online patients get equal care.	Dev in Progress
F-401	As a receptionist, I want each finished consultation to arrive as a task list, so that I print, collect and book without re-typing.	Completed
F-402	As a receptionist, I want to take UPI, cash or card against an open bill, so that checkout is quick and the receipt is automatic.	Dev in Progress
F-403	As a clinic owner, I want GST-correct invoices with a reason for every discount, so that my books stand up.	Dev in Progress
F-404	As a receptionist, I want to refund a paid bill with a reason, so that the day totals stay correct.	Dev in Progress
F-405	As a receptionist, I want to close the day and be told if the cash does not match, so that I find mistakes before I leave.	Dev in Progress
F-406	As a receptionist, I want a day and week view I can check arrivals in from, so that I know who is coming.	Dev in Progress
F-407	As a patient, I want a text when my token is called and when my prescription is ready, so that I do not keep asking.	Dev in Progress
F-408	As a patient, I want my reminders, prescriptions and reports on WhatsApp, so that I receive them where I actually read them.	Not Started
F-409	As a clinic owner, I want return-visit reminders and a waitlist, so that slots fill and no-shows fall.	Not Started
F-410	As a clinic owner, I want to sell treatment packages paid in instalments, so that chronic patients stay with us.	Not Started
F-411	As a clinic, I want to bill a TPA or corporate account separately from the patient, so that we can win corporate panels.	Not Started
F-501	As a clinic owner, I want reports on money, patients and waiting times, so that I know how the day is going.	Dev in Progress
F-502	As a clinic owner, I want the app to tell me what needs attention, so that I act instead of reading dashboards.	Dev in Progress
F-503	As a clinic owner, I want to download everything about my clinic, so that I am never trapped if I leave.	Dev in Progress
F-504	As an owner, I want to add doctors by their government ID and set their fees and room, so that the system stays accurate.	Dev in Progress
F-505	As an owner, I want to see who has set their PIN and who has been active, so that access is always clean.	Dev in Progress
F-506	As an owner, I want to manage branches and rooms, so that a multi-branch clinic works from one place.	Dev in Progress
F-507	As an owner, I want to set my clinic details, letterhead and data location, so that documents are correct and I know where data lives.	Dev in Progress
F-508	As an owner, I want to see my plan, usage and limits, so that I know what I can grow into.	Dev in Progress
F-509	As an owner, I want to see every message sent to patients and why it failed, so that I can chase delivery.	Dev in Progress
F-510	As a new clinic, I want to be running on MedMate within ten minutes, so that I can start seeing patients.	Dev in Progress
F-511	As a clinic, I want the terms and data agreement to be final and accurate, so that my obligations are clear.	Dev in Progress
F-512	As a clinic owner, I want to export the activity log, so that I can answer a compliance question.	Dev in Progress
F-513	As a Kannada-speaking nurse, I want the station screens in my language, so that I can work without translating.	Not Started
F-514	As a receptionist, I want to open the app straight to my desk, so that I do not choose my next action every time.	Not Started
F-515	As a doctor, I want to find any patient from anywhere in one keystroke, so that I can retrieve a record instantly.	Not Started
F-516	As a patient, I want to be told when my prescription is ready, so that I stop waiting in the clinic.	Dev in Progress
F-517	As a nurse on a slow tablet, I want the app to load fast, so that vitals are never delayed by waiting for pages.	Dev in Progress
F-518	As a doctor on the move, I want the station screens on my phone, so that I can consult away from the desk.	Not Started
F-519	As a clinic, I want my data backed up and stored in India, so that records are safe and compliant.	Dev in Progress
F-520	As a product owner, I want to see which features are used and collect feedback in-app, so that I build what clinics need.	Not Started`;

function createSheet() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  let sheet = ss.getSheetByName(SHEET_NAME);
  if (!sheet) sheet = ss.insertSheet(SHEET_NAME);
  sheet.clearContents();

  const rows = TSV.trim().split('\n').map((line) => line.split('\t'));
  sheet.getRange(1, 1, rows.length, HEADER.length).setValues(rows);

  sheet.getRange(1, 1, 1, HEADER.length)
    .setFontWeight('bold')
    .setBackground('#0d7a5a')
    .setFontColor('#ffffff');

  sheet.setFrozenRows(1);
  sheet.getRange('A:A').setWidth(90);
  sheet.getRange('B:B').setWidth(520);
  sheet.getRange('C:C').setWidth(140);

  // Status dropdown
  const rule = SpreadsheetApp.newDataValidation()
    .requireValueInList(STATUSES, true)
    .setAllowInvalid(false)
    .build();
  sheet.getRange(2, 3, rows.length - 1, 1).setDataValidation(rule);

  // Conditional formatting so the board is readable at a glance
  const last = rows.length;
  sheet.getRange(2, 3, last - 1, 1).setConditionalFormatRules([
    SpreadsheetApp.newConditionalFormatRule()
      .whenTextEqualTo('Completed').setBackground('#e6f4ee').setFontColor('#0d7a5a').build(),
    SpreadsheetApp.newConditionalFormatRule()
      .whenTextEqualTo('Dev in Progress').setBackground('#fff4e5').setFontColor('#a15c00').build(),
    SpreadsheetApp.newConditionalFormatRule()
      .whenTextEqualTo('Not Started').setBackground('#f1f3f5').setFontColor('#5b6169').build(),
  ]);
}
```

---

## 3. Status definitions

| Status | Meaning | Move it here when |
|---|---|---|
| **Not Started** | Not begun | Nothing started |
| **Dev in Progress** | Being built | The first line of code is written, or the work is partly done but not verified in the deployed environment |
| **Completed** | Shipped and verified | The work is merged, deployed to the demo environment, verified there, and the audit finding it closes is marked closed in `MEDMATE-PRODUCT-AUDIT.md` |

**Completed is a high bar on purpose.** Merging to a branch is *Dev in Progress*, not
*Completed*. A feature only becomes **Completed** when it is running and verified in the
deployed environment. This is the rule the previous tracker enforced automatically; keep it
here and the Sheet is just as trustworthy.

---

## 4. Current state at handover

| Status | Stories |
|---|---|
| **Dev in Progress** | 44 |
| **Not Started** | 23 |
| **Completed** | 10 |
| **Total** | **77** |

Per epic:

| Epic | Completed | Total |
|---|---|---|
| Foundation, Access & Audit | 0 | 9 |
| Patient Capture & Front Door | 4 | 14 |
| Clinical Workflow | 5 | 23 |
| Front Desk, Money & Scheduling | 1 | 11 |
| Owner, Compliance & Growth | 0 | 20 |

---

## 5. The full story list (readable copy)

Keep this section in sync by pasting the same rows — or just read it here and edit the Sheet.

| ID | Story | Status |
|---|---|---|
| F-101 | As a staff member, I want to sign in with my mobile number and a PIN, so that my actions are recorded against my name. | Dev in Progress |
| F-102 | As an owner, I want one permission model to drive both the menu and the API, so that what staff can see always matches what staff can do. | Dev in Progress |
| F-103 | As a front desk receptionist, I want patient records to hide clinical details, so that I cannot open anything that is not mine to see. | Not Started |
| F-104 | As a clinic administrator, I want clinical fields removed from patient and queue lists, so that my access matches my role. | Not Started |
| F-105 | As a clinic owner, I want every sign-in, record open and payment logged, so that I can prove who did what. | Dev in Progress |
| F-106 | As a clinic owner, I want shared tablets to lock when left unattended, so that patient data is never left open. | Dev in Progress |
| F-107 | As a clinic owner, I want one person retrying to never lock out the rest of the clinic, so that the front desk always keeps working. | Not Started |
| F-108 | As a doctor, I want to take over a patient assigned to a colleague, so that I am never blocked mid-consultation. | Not Started |
| F-109 | As a salaried doctor, I want to see only my own patients and earnings, so that other doctors records stay private. | Not Started |
| F-201 | As a receptionist, I want to turn any tablet into a patient check-in kiosk, so that patients check in without queueing at my desk. | Dev in Progress |
| F-202 | As a patient, I want to use the kiosk in my own language, so that I can check in without needing help. | Dev in Progress |
| F-203 | As a patient, I want to confirm my mobile with a code, so that my check-in is linked to the right record. | Completed |
| F-204 | As a patient, I want to enter my name, age, sex and allergies once at the kiosk, so that nobody has to type it again. | Dev in Progress |
| F-205 | As a patient, I want to see the doctors who are actually in clinic now, so that I join the right queue. | Not Started |
| F-206 | As a patient, I want to see the fee and get a token before paying, so that I can queue now and pay at the desk. | Completed |
| F-207 | As a patient, I want to check in by scanning a code with my phone, so that I do not have to touch the screen. | Dev in Progress |
| F-208 | As a patient, I want the kiosk to keep what I typed if I pause, so that I do not have to start again. | Not Started |
| F-209 | As a patient using a screen reader, I want the kiosk fully operable without a mouse, so that I can check in independently. | Not Started |
| F-210 | As a patient, I want to book a doctor online without making an account, so that booking takes a minute. | Completed |
| F-211 | As a clinic, I want the public booking API to reveal only my own clinic, so that other clinics data is never exposed. | Completed |
| F-212 | As a patient, I want to link my health ID and see exactly what is shared, so that my records travel safely. | Not Started |
| F-213 | As a patient, I want to see my appointments, reports and dues on my phone, so that I stop calling the clinic. | Not Started |
| F-214 | As a receptionist, I want duplicate patient records flagged and mergeable, so that a patient does not end up with two histories. | Not Started |
| F-301 | As a doctor, I want my queue ordered by urgency and wait time, so that the sickest patient is seen first. | Completed |
| F-302 | As a nurse, I want to record vitals once at the station, so that the doctor sees them without asking. | Dev in Progress |
| F-303 | As a doctor, I want emergency and red-flag patients surfaced immediately, so that I do not miss a critical case. | Completed |
| F-304 | As a nurse, I want to route a patient to the right doctor, so that they are seen by someone equipped for their problem. | Dev in Progress |
| F-305 | As a doctor, I want the patient key facts before I type anything, so that I can start the consult in seconds. | Completed |
| F-306 | As a doctor, I want one request for the whole clinical brief, so that the summary loads instantly. | Dev in Progress |
| F-307 | As a doctor, I want a seven-step consultation form, so that I record a complete visit in one flow. | Dev in Progress |
| F-308 | As a doctor, I want to tap examination findings by body system, so that I do not type during the consult. | Completed |
| F-309 | As a doctor, I want to search and code my diagnosis, so that reports are accurate and billable. | Dev in Progress |
| F-310 | As a doctor, I want to search any brand or salt, so that I prescribe what is actually stocked. | Dev in Progress |
| F-311 | As a doctor, I want to be warned about allergies and drug interactions before signing, so that I cannot prescribe something harmful. | Not Started |
| F-312 | As a doctor, I want to order tests from the consultation, so that the lab gets the order without a phone call. | Dev in Progress |
| F-313 | As a doctor, I want my common advice lines remembered, so that writing advice takes one tap. | Dev in Progress |
| F-314 | As a doctor, I want to book the follow-up inside the consultation, so that the patient leaves with a date. | Completed |
| F-315 | As a doctor, I want to save a repeated protocol and re-apply it, so that common visits take less typing. | Dev in Progress |
| F-316 | As a doctor, I want to sign prescriptions digitally, so that they are legally valid and reach the patient instantly. | Dev in Progress |
| F-317 | As a hospital or lab, I want records as standard FHIR data, so that any compliant system can read them. | Not Started |
| F-318 | As a doctor, I want referrals and colleague handovers in one inbox, so that nothing waiting on me is missed. | Dev in Progress |
| F-319 | As a doctor, I want abnormal results flagged and filed to the visit, so that I act on them quickly. | Dev in Progress |
| F-320 | As a doctor, I want to mark a no-show, so that my clinic no-show rate is accurate. | Dev in Progress |
| F-321 | As a doctor, I want the consultation drafted from the conversation, so that I spend more time with the patient. | Not Started |
| F-322 | As a doctor, I want to issue a certificate from the patient record, so that I do not retype it. | Dev in Progress |
| F-323 | As a doctor, I want to run a video consult that produces the same signed prescription, so that online patients get equal care. | Dev in Progress |
| F-401 | As a receptionist, I want each finished consultation to arrive as a task list, so that I print, collect and book without re-typing. | Completed |
| F-402 | As a receptionist, I want to take UPI, cash or card against an open bill, so that checkout is quick and the receipt is automatic. | Dev in Progress |
| F-403 | As a clinic owner, I want GST-correct invoices with a reason for every discount, so that my books stand up. | Dev in Progress |
| F-404 | As a receptionist, I want to refund a paid bill with a reason, so that the day totals stay correct. | Dev in Progress |
| F-405 | As a receptionist, I want to close the day and be told if the cash does not match, so that I find mistakes before I leave. | Dev in Progress |
| F-406 | As a receptionist, I want a day and week view I can check arrivals in from, so that I know who is coming. | Dev in Progress |
| F-407 | As a patient, I want a text when my token is called and when my prescription is ready, so that I do not keep asking. | Dev in Progress |
| F-408 | As a patient, I want my reminders, prescriptions and reports on WhatsApp, so that I receive them where I actually read them. | Not Started |
| F-409 | As a clinic owner, I want return-visit reminders and a waitlist, so that slots fill and no-shows fall. | Not Started |
| F-410 | As a clinic owner, I want to sell treatment packages paid in instalments, so that chronic patients stay with us. | Not Started |
| F-411 | As a clinic, I want to bill a TPA or corporate account separately from the patient, so that we can win corporate panels. | Not Started |
| F-501 | As a clinic owner, I want reports on money, patients and waiting times, so that I know how the day is going. | Dev in Progress |
| F-502 | As a clinic owner, I want the app to tell me what needs attention, so that I act instead of reading dashboards. | Dev in Progress |
| F-503 | As a clinic owner, I want to download everything about my clinic, so that I am never trapped if I leave. | Dev in Progress |
| F-504 | As an owner, I want to add doctors by their government ID and set their fees and room, so that the system stays accurate. | Dev in Progress |
| F-505 | As an owner, I want to see who has set their PIN and who has been active, so that access is always clean. | Dev in Progress |
| F-506 | As an owner, I want to manage branches and rooms, so that a multi-branch clinic works from one place. | Dev in Progress |
| F-507 | As an owner, I want to set my clinic details, letterhead and data location, so that documents are correct and I know where data lives. | Dev in Progress |
| F-508 | As an owner, I want to see my plan, usage and limits, so that I know what I can grow into. | Dev in Progress |
| F-509 | As an owner, I want to see every message sent to patients and why it failed, so that I can chase delivery. | Dev in Progress |
| F-510 | As a new clinic, I want to be running on MedMate within ten minutes, so that I can start seeing patients. | Dev in Progress |
| F-511 | As a clinic, I want the terms and data agreement to be final and accurate, so that my obligations are clear. | Dev in Progress |
| F-512 | As a clinic owner, I want to export the activity log, so that I can answer a compliance question. | Dev in Progress |
| F-513 | As a Kannada-speaking nurse, I want the station screens in my language, so that I can work without translating. | Not Started |
| F-514 | As a receptionist, I want to open the app straight to my desk, so that I do not choose my next action every time. | Not Started |
| F-515 | As a doctor, I want to find any patient from anywhere in one keystroke, so that I can retrieve a record instantly. | Not Started |
| F-516 | As a patient, I want to be told when my prescription is ready, so that I stop waiting in the clinic. | Dev in Progress |
| F-517 | As a nurse on a slow tablet, I want the app to load fast, so that vitals are never delayed by waiting for pages. | Dev in Progress |
| F-518 | As a doctor on the move, I want the station screens on my phone, so that I can consult away from the desk. | Not Started |
| F-519 | As a clinic, I want my data backed up and stored in India, so that records are safe and compliant. | Dev in Progress |
| F-520 | As a product owner, I want to see which features are used and collect feedback in-app, so that I build what clinics need. | Not Started |

---

## 6. Where the detail lives

The Sheet is the **status tracker**. The engineering detail stays in Markdown so it lives
next to the code:

| Document | What it holds |
|---|---|
| `MEDMATE-ARCHITECTURE.md` | How the product works, in plain language — the source the feature list was decomposed from |
| `MEDMATE-PRODUCT-AUDIT.md` | Every finding, with the live evidence behind it, and what each fix must close |
| `DEVELOPMENT-ROADMAP.md` | Sequencing, waves, exit gates, dependencies, risks, and the full acceptance criteria per feature |
| `FIX-PACKAGE.md` | The two verified fix packages (record-level access, OTP rate limiting) with their tests |
| `UI-SPEC.md` | The extracted design system — typography, icons, fonts, card dimensions — and the fidelity rules for new work |

**Migration note.** The old tracker (`roadmap-progress.json` and its CLI) has been removed
from the workspace per the file-management instruction. The three-state Sheet maps onto it
exactly:

| Old status | Sheet status |
|---|---|
| `shipped` | Completed |
| `implemented`, `in-progress` | Dev in Progress |
| `not-started`, `blocked` | Not Started |

The acceptance criteria, evidence links and dependency graph that the JSON held live in
`DEVELOPMENT-ROADMAP.md` §2 and the audit report.

---

*Generated 17 November 2026 from the live audit of `medmate-doctor-clinic.netlify.app`.*
