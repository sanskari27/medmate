# MedMate — Development Roadmap

**Derived from:** `MEDMATE-ARCHITECTURE.md` (every feature and requirement the product describes) and `MEDMATE-PRODUCT-AUDIT.md` (every gap, defect and risk found in the live audit of 17 Nov 2026).

**Scope:** 77 features across 5 epics, tracked to a completion percentage per feature.

---

## 1. How progress is tracked

**Progress now lives in a Google Sheet, not in this repository.**

| Document | Role |
|---|---|
| [`GOOGLE-SHEET-REQUIREMENTS.md`](GOOGLE-SHEET-REQUIREMENTS.md) | The tracker of record. Contains the sheet structure, the paste-in payload for all 77 stories, an Apps Script to create the sheet automatically, and the status definitions. |
| This document | The engineering plan: sequencing, waves, exit gates, dependencies, risks, and the acceptance criteria per feature. |

### Sheet structure — three columns

| Column | Contents |
|---|---|
| **ID** | `F-101` … `F-520`, stable across renames |
| **Story** | One Jira-style user story per feature — a single heading, no description, no extra fields |
| **Status** | **Not Started** · **Dev in Progress** · **Completed** |

### Status definitions

| Status | Meaning | Move it here when |
|---|---|---|
| **Not Started** | Not begun | Nothing started |
| **Dev in Progress** | Being built | The first line is written, or the work is partly done but not verified in the deployed environment |
| **Completed** | Shipped and verified | Merged **and** deployed to the demo environment **and** verified there, with the audit finding it closes marked closed in `MEDMATE-PRODUCT-AUDIT.md` |

**Completed is a high bar on purpose.** Merging to a branch is *Dev in Progress*.
A feature only becomes **Completed** when it is running and verified in the
deployed environment — the same rule the previous JSON tracker enforced
automatically, now carried by the status dropdown and the sheet's protection.

> **Status snapshot.** The table in §2 is a point-in-time snapshot taken on
> 17 Nov 2026. The Sheet is the live tracker; when the two disagree, the Sheet
> wins and this table is regenerated from it.


---

## 2. Current status

<!-- ROADMAP:PROGRESS:BEGIN -->
<!-- Status of this build. The Google Sheet is the live tracker; this table is the repo copy. -->
| ID | Story | Status |
|---|---|---|
| F-101 | As a staff member, I want to sign in with my mobile number and a PIN, so that my actions are recorded against my name. | Completed |
| F-102 | As an owner, I want one permission model to drive both the menu and the API, so that what staff can see always matches what staff can do. | Completed |
| F-103 | As a front desk receptionist, I want patient records to hide clinical details, so that I cannot open anything that is not mine to see. | Completed |
| F-104 | As a clinic administrator, I want clinical fields removed from patient and queue lists, so that my access matches my role. | Completed |
| F-105 | As a clinic owner, I want every sign-in, record open and payment logged, so that I can prove who did what. | Not Started |
| F-106 | As a clinic owner, I want shared tablets to lock when left unattended, so that patient data is never left open. | Dev in Progress |
| F-107 | As a clinic owner, I want one person retrying to never lock out the rest of the clinic, so that the front desk always keeps working. | Completed |
| F-108 | As a doctor, I want to take over a patient assigned to a colleague, so that I am never blocked mid-consultation. | Completed |
| F-109 | As a salaried doctor, I want to see only my own patients and earnings, so that other doctors records stay private. | Completed |
| F-201 | As a receptionist, I want to turn any tablet into a patient check-in kiosk, so that patients check in without queueing at my desk. | Dev in Progress |
| F-202 | As a patient, I want to use the kiosk in my own language, so that I can check in without needing help. | Not Started |
| F-203 | As a patient, I want to confirm my mobile with a code, so that my check-in is linked to the right record. | Not Started |
| F-204 | As a patient, I want to enter my name, age, sex and allergies once at the kiosk, so that nobody has to type it again. | Not Started |
| F-205 | As a patient, I want to see the doctors who are actually in clinic now, so that I join the right queue. | Completed |
| F-206 | As a patient, I want to see the fee and get a token before paying, so that I can queue now and pay at the desk. | Not Started |
| F-207 | As a patient, I want to check in by scanning a code with my phone, so that I do not have to touch the screen. | Not Started |
| F-208 | As a patient, I want the kiosk to keep what I typed if I pause, so that I do not have to start again. | Not Started |
| F-209 | As a patient using a screen reader, I want the kiosk fully operable without a mouse, so that I can check in independently. | Not Started |
| F-210 | As a patient, I want to book a doctor online without making an account, so that booking takes a minute. | Not Started |
| F-211 | As a clinic, I want the public booking API to reveal only my own clinic, so that other clinics data is never exposed. | Not Started |
| F-212 | As a patient, I want to link my health ID and see exactly what is shared, so that my records travel safely. | Not Started |
| F-213 | As a patient, I want to see my appointments, reports and dues on my phone, so that I stop calling the clinic. | Not Started |
| F-214 | As a receptionist, I want duplicate patient records flagged and mergeable, so that a patient does not end up with two histories. | Not Started |
| F-301 | As a doctor, I want my queue ordered by urgency and wait time, so that the sickest patient is seen first. | Dev in Progress |
| F-302 | As a nurse, I want to record vitals once at the station, so that the doctor sees them without asking. | Not Started |
| F-303 | As a doctor, I want emergency and red-flag patients surfaced immediately, so that I do not miss a critical case. | Dev in Progress |
| F-304 | As a nurse, I want to route a patient to the right doctor, so that they are seen by someone equipped for their problem. | Not Started |
| F-305 | As a doctor, I want the patient key facts before I type anything, so that I can start the consult in seconds. | Dev in Progress |
| F-306 | As a doctor, I want one request for the whole clinical brief, so that the summary loads instantly. | Not Started |
| F-307 | As a doctor, I want a seven-step consultation form, so that I record a complete visit in one flow. | Not Started |
| F-308 | As a doctor, I want to tap examination findings by body system, so that I do not type during the consult. | Not Started |
| F-309 | As a doctor, I want to search and code my diagnosis, so that reports are accurate and billable. | Not Started |
| F-310 | As a doctor, I want to search any brand or salt, so that I prescribe what is actually stocked. | Not Started |
| F-311 | As a doctor, I want to be warned about allergies and drug interactions before signing, so that I cannot prescribe something harmful. | Not Started |
| F-312 | As a doctor, I want to order tests from the consultation, so that the lab gets the order without a phone call. | Not Started |
| F-313 | As a doctor, I want my common advice lines remembered, so that writing advice takes one tap. | Not Started |
| F-314 | As a doctor, I want to book the follow-up inside the consultation, so that the patient leaves with a date. | Not Started |
| F-315 | As a doctor, I want to save a repeated protocol and re-apply it, so that common visits take less typing. | Not Started |
| F-316 | As a doctor, I want to sign prescriptions digitally, so that they are legally valid and reach the patient instantly. | Not Started |
| F-317 | As a hospital or lab, I want records as standard FHIR data, so that any compliant system can read them. | Not Started |
| F-318 | As a doctor, I want referrals and colleague handovers in one inbox, so that nothing waiting on me is missed. | Not Started |
| F-319 | As a doctor, I want abnormal results flagged and filed to the visit, so that I act on them quickly. | Not Started |
| F-320 | As a doctor, I want to mark a no-show, so that my clinic no-show rate is accurate. | Not Started |
| F-321 | As a doctor, I want the consultation drafted from the conversation, so that I spend more time with the patient. | Not Started |
| F-322 | As a doctor, I want to issue a certificate from the patient record, so that I do not retype it. | Not Started |
| F-323 | As a doctor, I want to run a video consult that produces the same signed prescription, so that online patients get equal care. | Not Started |
| F-401 | As a receptionist, I want each finished consultation to arrive as a task list, so that I print, collect and book without re-typing. | Dev in Progress |
| F-402 | As a receptionist, I want to take UPI, cash or card against an open bill, so that checkout is quick and the receipt is automatic. | Dev in Progress |
| F-403 | As a clinic owner, I want GST-correct invoices with a reason for every discount, so that my books stand up. | Not Started |
| F-404 | As a receptionist, I want to refund a paid bill with a reason, so that the day totals stay correct. | Not Started |
| F-405 | As a receptionist, I want to close the day and be told if the cash does not match, so that I find mistakes before I leave. | Not Started |
| F-406 | As a receptionist, I want a day and week view I can check arrivals in from, so that I know who is coming. | Not Started |
| F-407 | As a patient, I want a text when my token is called and when my prescription is ready, so that I do not keep asking. | Not Started |
| F-408 | As a patient, I want my reminders, prescriptions and reports on WhatsApp, so that I receive them where I actually read them. | Not Started |
| F-409 | As a clinic owner, I want return-visit reminders and a waitlist, so that slots fill and no-shows fall. | Not Started |
| F-410 | As a clinic owner, I want to sell treatment packages paid in instalments, so that chronic patients stay with us. | Not Started |
| F-411 | As a clinic, I want to bill a TPA or corporate account separately from the patient, so that we can win corporate panels. | Not Started |
| F-501 | As a clinic owner, I want reports on money, patients and waiting times, so that I know how the day is going. | Not Started |
| F-502 | As a clinic owner, I want the app to tell me what needs attention, so that I act instead of reading dashboards. | Not Started |
| F-503 | As a clinic owner, I want to download everything about my clinic, so that I am never trapped if I leave. | Not Started |
| F-504 | As an owner, I want to add doctors by their government ID and set their fees and room, so that the system stays accurate. | Not Started |
| F-505 | As an owner, I want to see who has set their PIN and who has been active, so that access is always clean. | Dev in Progress |
| F-506 | As an owner, I want to manage branches and rooms, so that a multi-branch clinic works from one place. | Not Started |
| F-507 | As an owner, I want to set my clinic details, letterhead and data location, so that documents are correct and I know where data lives. | Not Started |
| F-508 | As an owner, I want to see my plan, usage and limits, so that I know what I can grow into. | Not Started |
| F-509 | As an owner, I want to see every message sent to patients and why it failed, so that I can chase delivery. | Not Started |
| F-510 | As a new clinic, I want to be running on MedMate within ten minutes, so that I can start seeing patients. | Not Started |
| F-511 | As a clinic, I want the terms and data agreement to be final and accurate, so that my obligations are clear. | Not Started |
| F-512 | As a clinic owner, I want to export the activity log, so that I can answer a compliance question. | Not Started |
| F-513 | As a Kannada-speaking nurse, I want the station screens in my language, so that I can work without translating. | Not Started |
| F-514 | As a receptionist, I want to open the app straight to my desk, so that I do not choose my next action every time. | Not Started |
| F-515 | As a doctor, I want to find any patient from anywhere in one keystroke, so that I can retrieve a record instantly. | Not Started |
| F-516 | As a patient, I want to be told when my prescription is ready, so that I stop waiting in the clinic. | Not Started |
| F-517 | As a nurse on a slow tablet, I want the app to load fast, so that vitals are never delayed by waiting for pages. | Not Started |
| F-518 | As a doctor on the move, I want the station screens on my phone, so that I can consult away from the desk. | Not Started |
| F-519 | As a clinic, I want my data backed up and stored in India, so that records are safe and compliant. | Not Started |
| F-520 | As a product owner, I want to see which features are used and collect feedback in-app, so that I build what clinics need. | Not Started |
<!-- ROADMAP:PROGRESS:END -->

---

## 3. Sequencing

The plan runs in four waves. Each wave ends with a deployable state.

### Wave 0 — Close the security gaps (blocking, ~2 weeks)

*Nothing else matters if these ship wrong.* Fix packages for F1 and F3 are written and tested in `FIX-PACKAGE.md`.

| Feature | What | Audit ref |
|---|---|---|
| **F-103** | Record-level access enforcement in the data layer | F1 (High) — contradicts DPA §4 |
| **F-104** | Redacted projection for queue and patient list | F1 |
| **F-107** | OTP limiter keyed on phone + IP, with `Retry-After` | F3 (High) — caused the audit lockouts |
| **F-108** | Cover-for-colleague: take over a patient's consult | F2 (High) — hard dead end |
| **F-109** | Doctor-scoped financials, queues, patient lists | F5 |
| **F-102** | Single role matrix, re-signed off against the persona spec | F4 |
| **F-205** | Presence-driven kiosk doctor roster | D3 |
| **F-208** | Kiosk idle reset that preserves entered data | D5, W6 |
| **F-209** | Kiosk accessibility to WCAG 2.2 AA | W5 |

**Exit gate:** `FIX-PACKAGE.md` tests green, F1 and F2 closed in the audit, the DPA sentence in §4 literally true.

### Wave 1 — Make it fast (2–3 weeks)

The single biggest perceived-speed win in the whole roadmap.

| Feature | What | Audit ref |
|---|---|---|
| **F-514** | Role landing pages replacing the universal dashboard | W1 |
| **F-515** | Global patient search / command palette | W4 |
| **F-516** | Patient notification when the prescription is ready | D2 |
| **F-517** | Prefetch control, lazy loading, polling hygiene | W8 |
| **F-306** | Re-scope the patient brief endpoint | F1 follow-up |
| **F-209** | Kiosk a11y (carried from Wave 0 if it slips) | W5 |

**Exit gate:** measured time-to-first-action per role, before and after.

### Wave 2 — Close the commercial gap (4–6 weeks)

Where MedMate actually trails the market.

| Feature | What | Audit ref |
|---|---|---|
| **F-407** | Connect the SMS provider (DLT templates) | Gap 2 — `smsReady: false` |
| **F-408** | WhatsApp channel for reminders, prescriptions, reports | Gap 2 |
| **F-212** | ABHA creation/verification + consent capture | Gap 3, L2 |
| **F-317** | FHIR R4 export with SNOMED CT / ICD-10 | Gap 4 |
| **F-503** | Full clinic data export | L3 — Terms and DPA §9 promise |
| **F-402** | Live UPI gateway with a published MDR | Gap 5 |
| **F-311** | Drug interaction, allergy and dose validation | Gap 6 — the strongest safety differentiator |
| **F-409** | Recall, waitlist and no-show control | Gap 7 |
| **F-213** | Patient portal / installable web app | Gap 1 — the biggest gap |
| **F-519** | India data residency, backup and DR | DPA §6 |
| **F-511** | Finalise Terms, DPA and Clinic declaration | L1–L7 |

**Exit gate:** every sentence in the published documents is true of the running product; DPDP compliance-manager provisions (from 13 Nov 2026) are met.

### Wave 3 — Defend the position (ongoing)

| Feature | What | Audit ref |
|---|---|---|
| **F-321** | AI scribe (ambient note → structured consultation) | Gap 11 |
| **F-410** | Packages, instalments, chronic-care plans | Gap 9 |
| **F-411** | TPA and corporate billing | Gap 9 |
| **F-513** | Multilingual staff interface | — |
| **F-518** | Staff mobile/tablet installable PWA (two screens only) | — |
| **F-520** | Product analytics and in-product feedback | — |
| **F-512** | Compliance reporting and audit export | — |

---

## 4. Epic-by-epic plan

### EPIC-1 — Foundation, Access & Audit
*Make every identity, permission and audit guarantee true in production.*

This epic carries the three High findings. It is first because every other
epic inherits its permission model — the front desk, the nurse, the doctor and
the admin all sit on top of it.

- **F-101 Sign-in** — OTP + personal PIN. Shipped; needs an admin PIN-reset path (AC4) and a live SMS provider.
- **F-102 Role model** — one capability model driving both UI and API. Shipped at module level; AC4 (no second hardcoded matrix) is still open.
- **F-103 / F-104 Record enforcement and redaction** — the F1 fix. Central policy, one place, no per-endpoint drift. Fix in `FIX-PACKAGE.md` §2 (`lib/rbac-policy.ts`).
- **F-105 Audit log** — live and populated; immutability (AC3) and export (AC4) outstanding.
- **F-106 Screen and device lock** — the kiosk device lock (HTTP 423) is a genuine differentiator. AC4, the fallback exit when the opener's PIN is unavailable, is a real operational trap.
- **F-107 Rate limiting** — the F3 fix. Fix in `FIX-PACKAGE.md` §4 (`lib/otp-rate-limit.ts`).
- **F-108 Cover for colleague** — the F2 fix. Needs `POST /api/visits/:id/claim`, a "covering for Dr X" banner, and an audit entry.
- **F-109 Doctor scoping** — apply the `/api/reports` coercion pattern to invoices, day-close, queue and patients.

**Design decision worth keeping:** the kiosk's `423` device lock is stronger
than anything competitors in this market ship. Do not weaken it to make the
kiosk "easier" — instead add the fallback exit (F-106 AC4).

### EPIC-2 — Patient Capture & Front Door
*Make the first ninety seconds fast, multilingual, accessible and self-service.*

The kiosk is the best-executed surface in the product: multilingual, a
five-step progress bar, an on-screen keypad, a QR alternative, a token issued
before payment, and a live wait estimate. A full walk-in was completed on the
live demo (token W-03) and it worked end to end.

- **F-201 Kiosk device mode** — shipped; needs crash recovery (AC4).
- **F-202 Multilingual** — three languages live; locale persistence across the idle reset (AC2) and completeness (AC3) outstanding.
- **F-203 / F-204 / F-206** — OTP check-in, registration, fee and token — shipped.
- **F-205 Presence-driven roster** — the kiosk listed 2 of 3 doctors and omitted a doctor with a waiting patient. The list is schedule-driven and must become presence-driven.
- **F-207 QR check-in** — the scan path was not exercised end to end (AC2).
- **F-208 / F-209** — idle reset and accessibility. The 8-second warning wiped a half-filled patient form, and the kiosk inputs have no accessible name.
- **F-210 / F-211 Booking and availability API** — shipped, and the multi-tenant isolation on the public API is clean.
- **F-212 ABHA + consent** — not started, and the login page already claims *"Patient records only with ABHA consent"*. Reconcile before it reaches a brochure.
- **F-213 Patient portal** — the single largest gap versus the market.
- **F-214 Duplicate-patient merge** — a kiosk walk-in can silently create a second record for the same person.

**Design decision worth keeping:** the token is issued **before** payment, and
"Pay at the front desk" is an equally prominent option. Do not gate queue
position behind payment — it will cost more in walk-ins than it recovers.

### EPIC-3 — Clinical Workflow
*Make the doctor console the fastest and safest place in Indian practice.*

The strongest part of the product: a triage-first brief instead of a blank
form, tap-based examination capture, a formulary that searches brand or salt,
an advice library that compounds, and a sign-off that refuses an empty
prescription.

- **F-301 / F-303 / F-305 / F-306** — queue, triage, console, brief — shipped.
- **F-302 / F-304** — nurse vitals and routing — implemented but not exercised end to end; F-304 AC3 must settle whether the patient's kiosk choice or the nurse's routing wins.
- **F-307 / F-308** — the seven-step form and tap-based examination — shipped.
- **F-309 / F-310** — diagnosis and medicines — implemented; ICD-10 mapping and generic-first printing outstanding.
- **F-311 Interaction, allergy and dose validation** — not started. The Terms claim the app shows "doses, tests, interactions". This is the strongest safety feature available to MedMate and a hard blocker for institutional sales.
- **F-312 / F-319** — test ordering and lab results with abnormal flags — implemented; no external lab feed confirmed.
- **F-313** — advice library — one of the cheapest time-savers in the product.
- **F-314** — follow-up booking from the consult — shipped.
- **F-315** — treatment protocol templates — implemented. **Audit recommends narrowing this** (see §6).
- **F-316** — e-sign — implemented; a live licensed Class 2 DSC provider is required before any real patient.
- **F-317** — FHIR export — not started; mandatory for clinics from 1 Apr 2023.
- **F-318 / F-320** — referrals, handovers, no-shows — implemented.
- **F-321** — AI scribe — the fastest-growing paid add-on in the market. TPG ¶5.4: AI may assist, never counsel or prescribe.
- **F-322 / F-323** — certificates and teleconsult — implemented.

**Design decision worth keeping:** *"The complaints print; the history stays in
the record."* That one sentence is a better data-minimisation design than most
EMRs in this market manage, and it should survive the AI scribe work.

### EPIC-4 — Front Desk, Money & Scheduling
*Make checkout one screen with nothing re-typed, and the patient reachable.*

The reception handover is the best front-desk idea in the product: the signed
prescription arrives as a task with a checklist, not as an ambiguous "someone
was seen".

- **F-401 Checkout checklist** — shipped.
- **F-402 / F-403 / F-404 / F-405** — POS, invoices, refunds, day close — implemented. A live payment gateway with a published MDR is still missing, and partial/split payment is not supported.
- **F-406 Appointments** — implemented; conflict blocking outstanding.
- **F-407 / F-408** — SMS is designed but not connected (`smsReady: false`, 8 messages `not_set_up`); WhatsApp is not started. In India this is table stakes, not a feature.
- **F-409** — recall, waitlist, no-show control — not started.
- **F-410 / F-411** — packages, instalments, TPA and corporate billing — not started.

**Design decision worth keeping:** day close refuses to close while a bill is
unpaid and says so plainly. Keep that. Also keep the "discount requires a
reason" rule — it is what makes the books defensible.

### EPIC-5 — Owner, Compliance & Growth
*Make the owner able to run the business, and make every legal commitment true.*

- **F-501 / F-502 Reports and insights** — implemented. The "Worth a look" lines are the differentiator against ₹499 queue-only tools.
- **F-503 Full data export** — partially there (`/api/patients/export` exists); the Terms and DPA both promise a full copy. This is a trust feature that prevents the number-one churn driver in this market.
- **F-504 / F-505 / F-506 / F-507** — doctors, staff, locations, settings — implemented.
- **F-508 Subscription** — implemented. **Audit recommends repackaging**: per clinic plus per doctor, with front-desk and nurse seats free, and moving this page out of the staff navigation.
- **F-509 Messages ledger** — implemented. **Audit recommends moving it into Settings** — it is an audit view, not a daily task.
- **F-510 Onboarding** — implemented; a new clinic should reach a working first-day state in under ten minutes.
- **F-511 Legal documents** — all three are well drafted but marked *"draft awaiting legal review"*. L1–L7 in the audit track which written claims the implementation does not yet meet.
- **F-512** — compliance export.
- **F-513 / F-514 / F-515 / F-516 / F-517 / F-518** — multilingual staff UI, role landing pages, global search, patient notifications, performance, mobile PWA.
- **F-519** — India data residency, backup, DR.
- **F-520** — product analytics, consent-respecting, never reusing patient data.

---

## 5. Cross-cutting requirements

These apply to every feature, not just one.

| Requirement | Why | Verified by |
|---|---|---|
| **Server-side authorization on every endpoint** | Link hiding is not security; the audit probed the API directly | `FIX-PACKAGE.md` §3 |
| **No clinical field reaches a role without `records`** | DPA §4 is a written commitment | `FIX-PACKAGE.md` §3 |
| **Every state change is audit-logged with actor and time** | DPDP audit trail | F-105 AC1 |
| **A feature is `Completed` only when deployed and verified** | Prevents the tracker drifting from reality | Sheet status + `verify/check-fidelity.js` |
| **WCAG 2.2 AA on every patient- and staff-facing screen** | The kiosk is the most public surface and currently the least accessible | F-209 |
| **The demo-mode banner stays until live keys are connected** | Signatures, ABDM and payments are all `"test"` | Manual check |
| **No clinical data in analytics, logs or third-party calls** | DPA §2 | F-520 |
| **Production data in India** | DPA §6 | F-519 |
| **Full data export, free, without a support request** | Terms and DPA §9; the top churn driver in this market | F-503 |
| **Explicit, non-mutating projections** | A redactor that mutates its source row corrupts the audit trail | `FIX-PACKAGE.md` §3 |

---

## 6. Implementation and UI fidelity

The first development pass lives in **`MedmateApp/`** (sibling to this
document). It establishes the UI foundation and the application shell.

### The fidelity rule

Anything built for MedMate must match the MVP's UI/UX exactly — typography,
icons, fonts and card dimensions. That is enforced by construction:

- The **product's own stylesheet** is used verbatim (`MedmateApp/styles/medmate.css`, 168 KB, taken from the deployment).
- The **product's own 38-icon set** is used byte-exact (`MedmateApp/js/icons.js`).
- The font is **Outfit 400–800** from Google Fonts, loaded exactly as the MVP loads it.
- Card geometry is fixed and measured: station card **316 × 162**, radius 18px, padding 18px, gap 6px, min-height 150px, border `1px solid #E7ECE9`, icon tile 48×48 with a 24×24 glyph.

### Automated fidelity check

`MedmateApp/verify/check-fidelity.js` compares the computed styles of the
build against the values measured on the live app. Current result:

```
38 properties checked · 0 drift · 0 console errors
```

Run it by pasting the script into DevTools on the running build, or through
Playwright. Add it to CI so a change that alters a token, a radius or a card
dimension fails the build.

### The contract

`UI-SPEC.md` is the design contract for all future work: the type scale, the
colour tokens, the geometry table, the icon inventory, the motion rules, the
breakpoints, and seven fidelity rules (reuse the class vocabulary, never
hardcode a colour, never add a resting shadow, card geometry is fixed,
micro-labels are always 10–11px/800/tracked, test at 1280×720, verify by
measurement).

### Screens built

`#/dashboard` · `#/queue` (Doctor Console) · `#/desk` (Reception Desk) ·
`#/billing` (Billing & POS) · `#/patients` (Patient records) · `#/kiosk`
(Patient Kiosk)

---

## 7. What to cut or narrow

Straight from audit §4.3, with a roadmap consequence for each.

| Action | Item | Consequence |
|---|---|---|
| **Cut from navigation** | Subscription page | Move into account settings (F-508 AC4) |
| **Cut from navigation** | Patient messages ledger | Move into Settings (F-509 AC3) |
| **Narrow** | Lab & Diagnostics as a full module | Reduce to "order → result" unless the clinic owns the lab (F-312, F-319) |
| **Narrow** | Teleconsult as a built-in video product | Keep the digital Rx + ABHA push; embed the call (F-323) |
| **Defer** | Treatment protocol templates | The advice library already captures most of the value (F-315) |
| **Defer** | Locations as a top-level nav item | Make it a Settings tab (F-506) |
| **Replace** | The 9-card universal dashboard | Four role landing pages (F-514) |
| **Keep** | Staff & roles, RBAC matrix, activity log | Differentiating and compliance-supporting |
| **Keep** | Reports "Worth a look" insights | Differentiates against ₹499 queue tools |
| **Keep** | Consultation form, kiosk, reception handover | The core |

**Explicitly not building** (market-fit decision, not a gap): US-style
insurance claims, RCM, superbills, CMS-1500/ERA, payroll, inventory and
pharmacy, e-commerce and gift cards, website builders, and marketplace
advertising. Keep only TPA, corporate billing and packages.

---

## 7. The build

The application is built in this workspace, from scratch, story by story.

```bash
node server/server.mjs          # http://127.0.0.1:8812  (app + API)
node --test "test/*.test.mjs"   # 50 tests
```

```
index.html            app shell
js/
  api.js              API client (same-origin session cookie)
  app.js              router, shell, sign-in, live data loading
  screens.js          screen renderers (pure functions over fetched data)
  icons.js            the 38-icon set, byte-exact from the MVP
  data.js             captured API payloads (browser fixtures + server seed)
styles/
  medmate.css         the product's own stylesheet, verbatim
  app.css             shell wiring only - no token is redefined
server/
  server.mjs          zero-dependency HTTP server: static + API
  lib/rbac-policy.mjs F-103 / F-104 / F-109 - one policy, enforced everywhere
  lib/otp-rate-limit.mjs F-107 - two-tier limiter, phone + IP keyed
  data/seed.mjs       seeded records, shared with the browser fixtures
test/                 node:test suites, including end-to-end HTTP tests
verify/               UI fidelity check (38 properties + icon glyphs)
```

### Story to code

| Story | Where it lives | Test |
|---|---|---|
| **F-101** sign in with OTP + PIN | `server/server.mjs` → `POST /api/auth/otp`, `POST /api/auth/verify`; `js/app.js` sign-in flow | `test/api.test.mjs` |
| **F-102** one capability model | `server/lib/rbac-policy.mjs` → `capabilitiesFor` | `test/rbac-policy.test.mjs` |
| **F-103** record-level enforcement | `server/lib/rbac-policy.mjs` → `projectPatient`, `projectQueueItem`, `projectVisit` | `test/api.test.mjs` |
| **F-104** field-level redaction | same module; the queue and patient projections | `test/api.test.mjs` |
| **F-107** rate limiting | `server/lib/otp-rate-limit.mjs`; wired into `/api/auth/otp` and `/api/kiosk` | `test/otp-rate-limit.test.mjs`, `test/api.test.mjs` |
| **F-108** cover for colleague | `POST /api/visits/:id/claim`; the "Take over this patient" button in `js/screens.js` | `test/api.test.mjs` |
| **F-109** doctor scoping | `scopeDoctor` / `scopeRows`; applied to queue, invoices, day close | `test/api.test.mjs` |
| **F-205** presence-driven kiosk roster | `GET /api/kiosk` derives the list from who is holding a patient | `test/api.test.mjs` |
| **F-311** allergy, interaction and dose checks | `server/lib/clinical.mjs`; `POST /api/visits/:id/prescriptions/check` and `/prescriptions`; `js/prescribing.js` | `test/clinical.test.mjs`, `test/api.test.mjs` |
| **F-514** role landing pages | `GET /api/landing`; `landingScreen` in `js/screens.js`; the home route | `test/api.test.mjs` |

### Verified behaviour

| Role | Patient list | Queue | Queue vitals | Queue scope |
|---|---|---|---|---|
| Front desk (Priya) | names only, no conditions or allergies | tokens and priority only | none | clinic-wide |
| Nurse (Mary) | names only | tokens and priority only | **yes, she recorded them** | clinic-wide |
| Doctor (Vikram) | full clinical record | full clinical record | yes | own queue |
| Owner (Ananya) | full clinical record | full clinical record | yes | clinic-wide, plus takeover |

### Where each role now lands

| Role | Lands on | Sees first |
|---|---|---|
| Front desk | **At the desk** | waiting at the desk, to collect, follow-ups to book, collected today |
| Nurse | **Patients needing you** | need vitals, ready for the doctor, urgent or emergency |
| Doctor | **Your queue, <name>** | waiting for you, urgent, with you now, seen today - and only their own patients |
| Clinic admin | **Money and exceptions** | collected today, to collect, unpaid bills, doctors on duty |
| Owner | **Your clinic today** | the whole clinic queue, plus takeover on any patient |

This was checked in the running app, not just in unit tests: the front desk's screen
contains no "Heart disease", no allergy and no vitals, while the doctor's screen does.

### Still to build

The next stories in order are **F-209** (kiosk accessibility), **F-402/F-403** (live
payments), **F-503** (the full data export the Terms promise), then **F-213** (the
patient portal) and **F-408** (WhatsApp).

---

## 8. Definition of Done

A feature is done when **all** of the following are true:

- [ ] Every acceptance criterion listed in this document is met
- [ ] Unit and integration tests cover it (minimum 80% on touched files)
- [ ] It is deployed to the demo environment and verified there
- [ ] The **Status** cell in the Google Sheet is set to **Completed**
- [ ] No new console errors; no unhandled promise rejections
- [ ] The audit finding it resolves is marked closed in `MEDMATE-PRODUCT-AUDIT.md`
- [ ] The UI matches `UI-SPEC.md`, and `verify/check-fidelity.js` reports zero drift
- [ ] The sheet's status dropdown still holds one of the three allowed values

---

## 9. Risks and external dependencies

| Risk | Impact | Mitigation |
|---|---|---|
| ABDM sandbox and HFR/HPR provisioning timelines | F-212, F-317 slip | Apply for the HFR facility ID now; sandbox access is a lead-time item, not a build item |
| Live e-sign provider (Class 2 DSC) | F-316 cannot ship | Vendor selection and KYC lead time; contract early |
| SMS DLT template registration | F-407 blocked | TRAI DLT registration takes days per template; start early |
| DPDP consent-manager provisions live from 13 Nov 2026, the remainder from 13 May 2027 | F-212, F-511 | Build to the full DPDP timeline now; the in-between window is when most vendors ship non-compliant software |
| Third-party integrations (SMS, UPI, e-sign, ABDM) all report `"test"` in `integrations` | Demo-versus-production gap | Keep the demo banner until every key is live; add a deployment checklist to CI |
| Rate limiter needs a shared store on Netlify | F-107 degrades across instances | Implement `LimitStore` against Upstash Redis before launch |
| The audit could not verify 9 screens or the nurse routing flow | Unknown unknowns in those flows | Re-run the black-box audit after Wave 0 lands |

---

## 10. Open questions for the product owner

1. Is the front desk **supposed** to see the chief complaint? The fix keeps
   it (a receptionist must be able to answer "what are you here for?") and
   strips everything else. If the answer is no, set `STRIP_CHIEF_COMPLAINT = true`.
2. Should a **salaried doctor** see clinic-wide revenue? The fix scopes a
   non-owner doctor to their own patients and their own earnings, and the
   clinic-wide view is reserved for owner and admin.
3. Is the Doctor Console visible to the front desk and nurse **by intent**? The
   matrix says yes; the persona brief says no. This needs a decision, not a
   default.
4. Should **teleconsult video** be built or embedded? The audit recommends
   keeping the digital Rx and ABHA push and embedding the call.
5. Do you want to **keep or cut** treatment protocol templates (F-315)? The
   audit recommends narrowing them in favour of the advice library.
6. Who owns the **ABHA consent** text — clinical, legal or both? It is a
   regulated notice and it is currently written by nobody.

---

*Companion documents: `GOOGLE-SHEET-REQUIREMENTS.md` (the tracker of record), `UI-SPEC.md` (the design contract), `FIX-PACKAGE.md` (the two verified fix packages), `MEDMATE-ARCHITECTURE.md` (how the product works, in plain language), `MEDMATE-PRODUCT-AUDIT.md` (the evidence behind every finding).*
