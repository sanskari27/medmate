# MedMate — Product & SaaS Audit (Phase 1)

**Product:** MedMate Doctor — clinic & doctor management dashboard
**Audited environment:** https://medmate-doctor-clinic.netlify.app (Netlify, demo/test mode)
**Date of audit:** 17 November 2026
**Method:** Live black-box audit of the deployed product. Every finding below is backed by an observed HTTP request/response, a rendered screen, or a quoted string from the running app. No source code was available for this review (the working directory was empty), so all conclusions are behavioural, not source-derived.

---

## 0. Executive summary

MedMate is a **good MVP with a real clinical spine**. The consultation form, the triage-first doctor console, the kiosk, and the "one place" reception checkout are better than most Indian clinic software on the market, and the developer has clearly built for the realities of an Indian multi-doctor clinic (ABDM, ABDM-consent, FHIR, e-sign, UPI, GST, six regional languages in the kiosk).

The product's weakness is **not** the feature set — it is **permission granularity and the shape of the landing screen**.

**Five things must be fixed before this goes to a paying clinic:**

| # | Finding | Severity |
|---|---|---|
| **F1** | Front desk receives clinical data (`conditions`, `allergies`) despite `records:false`. Spec says front desk has no clinical access. | **High** |
| **F2** | A doctor (including the clinic owner) **cannot consult another doctor's patient**. Hard dead end, no cover-for-colleague path. | **High** |
| **F3** | Sign-in OTP rate limit is keyed on **IP, not phone**. One person retrying locks the whole clinic out. | **High** |
| **F4** | RBAC is **module-level only**. No record-level or field-level control, and the enforced matrix contradicts the documented persona spec. | **Medium-High** |
| **F5** | Non-owner doctors can read **clinic-wide money** and **all patients' data** (invoices, day-close, all-doctors queue). | **Medium** |

**The single highest-leverage product change:** replace the one universal dashboard with **four role landing pages**. Today every one of the four roles opens the app and chooses from the same 9 station cards and 10 manage links. In a clinic at 9:00am with a queue forming, that is 2–3 wasted clicks on every single patient. Role landing pages (Doctor → my queue; Reception → desk + money; Nurse → vitals queue; Admin → exceptions) is a day of work and the single biggest perceived-speed win.

**Commercial read:** the clinical engine is ahead of the market; the **patient-facing and messaging layers are behind it**. There is no patient portal/app, and messaging is SMS-only with the SMS gateway not even connected (`smsReady: false`, 8 messages `not_set_up`). Practo Ray, Eka, HealthPlix and Jane all treat the patient channel as the product's growth loop. This is the main gap between MedMate and the competitors it will be compared against.

---

## 1. UI/UX design

### 1.1 What is genuinely strong

**The app teaches itself.** The dashboard is not a menu, it is a narrative: "Open a station — Patients move left to right, top to bottom", then `Step 1 Patient Kiosk` → `Step 2 Nurse Station` → `Step 3 Doctor Console` → `Step 4 Reception Desk`, each with a plain-English sentence explaining who uses it and why. For a clinic that employs reception staff with no software background, this is the correct design and it is very rare in this market.

**Triage-first doctor console.** Opening a patient gives the doctor the decision-relevant summary before anything else:

```
Reyansh Sharma · W-01 / 25M · In-clinic · Fever
Marked emergency by the nurse.
Look first: Temp 101°F · Pulse 120/min
```

With red flags, severity, symptoms, wait time ("Waiting 38 min") and the nurse's vitals pre-filled. In a 4-minute consult, this is the difference between a good screen and a slow one. Competitors typically open a blank form or a chart.

**The consultation form is well architected.** Seven numbered steps — Complaints & history → Examination → Diagnosis → Medicines → Tests → Advice → Follow-up — with two details that show real clinical thinking:

- *"Chief complaints (prints on the prescription) / History (optional, for the record)"* — the app teaches the doctor that history stays in the record. That is a genuine data-minimisation design decision.
- Examination is **tap-based by body system** (General, Chest, Heart, ENT, Abdomen, Nervous system, Joints, Skin) with `+ Febrile`, `+ Crepitations`, `+ Guarding` etc. instead of free-text. This removes typing from the hottest part of the workflow.

**Advice library that compounds.** Step 6 offers one-tap advice ("Drink plenty of water", "Steam inhalation twice a day") with `Add & remember` to build the doctor's own library over time, and "More advice (14)".

**"Add a diagnosis, medicines or advice first."** The sign-off guard rail. The doctor cannot sign an empty prescription; the validation message names the exact missing pieces, and `Sign & send to reception` is followed by an explicit handover checklist for the front desk ("Print and hand over the prescription / Collect the consultation fee / Book the follow-up visit / Collect the lab sample").

**Kiosk.** Multilingual (English / ಕನ್ನಡ / हिन्दी), 5-step progress bar (`Mobile → Code → Patient → Doctor → Pay`), on-screen keypad (not a system keyboard), QR alternative ("Scan with your camera. No app needed."), live per-doctor wait times, idle reset, and a token issued **before** payment with a cash alternative ("Pay at the front desk"). I completed a full walk-in as a patient on it and it works end to end.

**Public booking.** 3 steps, no login: doctor (with both in-clinic and video fees) → day/15-min slot grid → name/age/sex/reason/mobile + OTP. "You pay at the visit."

**Reports that a clinic owner actually opens.** Not dashboards for their own sake — it leads with *"₹500 still to collect from 1 bill"* and *"Busiest time: Mondays around 11 am"*. That is the right altitude.

**Inbox.** Referrals, lab results with out-of-range flags, and handovers in one place, with a real clinical example: *"BP 146/92 at her gynaecology visit, already on amlodipine 5 mg. Please review her BP treatment and kidney function."*

**Audit trail.** Staff → Activity log records named actors and verbs: `Dr. Meghana Iyer started a prescription for Reyansh Sharma`, `Dr. Vikram Shenoy visit call Roni Paul · W-02`, `Dr. Ananya Rao looked at reports`. This is a DPDP audit-trail requirement met in substance.

### 1.2 What is weak

**W1 — One dashboard for four roles (highest-impact UX issue).** The dashboard shows the same 9 station cards + 3 doctor consoles + 10 manage links to every role. A nurse opening the app to record vitals must dismiss "Teleconsultation", "Subscription", "Locations" and "Patient messages" to reach the Nurse Station. A front desk user opening the app to collect ₹500 must navigate past the doctor console. **Recommendation:** role landing pages (see §5.2).

**W2 — The Doctor Console is visible to front desk and nurse.** Per the in-app matrix, `Doctor Console` is allowed for Front desk, Nurse, Clinic admin and Doctor. Combined with F1, the front desk can see complaint reasons, symptoms, red flags and severity for every patient in the clinic — information they have no clinical use for, on a screen that may face a waiting room. Hide the console from non-doctors, or reduce it to a read-only "token board".

**W3 — The consult page for a non-treating doctor is a dead end.** Opening a patient's consult as anyone other than the assigned doctor yields:

> *"Only the doctor treating this patient can write the prescription"* → [Back to queue]

and an **unhandled `403` console error** on `GET /api/prescriptions`. There is no "take over this patient", "reassign to me", "consult as covering doctor" or contact-owner affordance. See F2 — this is also the single most likely real-world blocker.

**W4 — No global search or command palette.** A doctor who needs "that patient's record" must go to *Patients* and type into a filter. In a busy clinic, one-keystroke patient lookup is a standard expectation (Practo, Jane, eClinicalWorks all have it).

**W5 — Kiosk accessibility gaps.** The kiosk text inputs carry **no `placeholder`, no `aria-label`, no `name`**; selected state is conveyed only by a CSS class (`on`) with no `aria-pressed`; the tick/cross icons in the role matrix are `aria-hidden="true"` SVGs with no text alternative; and the kiosk controls animate continuously (this animation is what broke automated clicking, and there is no `prefers-reduced-motion` handling observed). The kiosk is the most patient-facing surface in the product and the least accessible.

**W6 — The kiosk idle timeout is too aggressive for its users.** The warning reads *"Are you still there? This screen will reset in 8 seconds"*. It fired while I was entering a patient's name/age/sex/allergy and wiped the form. The demographic most likely to use a self-service kiosk — elderly, first-time patients, slow typists — is the demographic most likely to be interrupted by an 8-second countdown.

**W7 — No visible "covering" context.** When a doctor opens a patient assigned to someone else, the screen gives no hint of who that is, whether they are in clinic, or how to reach them.

**W8 — Heavy page weight on clinic hardware.** Every dashboard render prefetches **all** nav-linked route payloads. In one session I observed the ~20-link prefetch burst repeat **12 times** (≈240 RSC GETs, all `200`). On a low-cost tablet or a shared-clinic wifi link this is wasted bandwidth and it competes with the 10-second queue polling. Recommendation: disable prefetch for non-primary links, and lazy-load the station modules.

### 1.3 Screen inventory verified

| Screen | Route | Verified how |
|---|---|---|
| Sign-in | `/login` | Live |
| Clinic setup | `/start` | Live |
| Dashboard | `/dashboard` | Live (owner) |
| Patient Kiosk (staff view + device mode) | `/kiosk` | Live, full patient journey completed |
| Nurse Station | `/nurse` | Live |
| Doctor Console | `/queue` | Live |
| Patient brief (popover) | `/queue` → `GET /api/visits/:id/brief` | Live |
| Consultation / prescription | `/visit/:id` | Live (treating doctor) |
| Reception Desk | `/desk` | Live |
| Billing & POS | `/billing` | Live |
| Patient records (list + record) | `/patients`, `/patients/:id` | Live |
| Reports | `/reports` | Live |
| Staff & roles (+ RBAC matrix + activity log) | `/staff` | Live |
| Doctor Inbox | `/inbox` | Live |
| Public booking | `/book?clinic=medmate-clinic` | Live, 3 steps completed |
| Terms | `/legal/terms` | Live |
| Data Processing Agreement | `/legal/dpa` | Live |
| Clinic declaration | `/legal/declaration` | Live |

**Not exercised** (OTP rate limit — see F3): `/lab`, `/teleconsult`, `/schedule`, `/settings`, `/subscription`, `/templates`, `/messages`, `/locations`, `/doctors` screens, the nurse vitals-entry and routing actions, and the reception record-level API probes. Their existence, nav placement and API access are confirmed from the owner crawl; their *screen content* was not read.

---

## 2. Role-Based Access Control

### 2.1 Method

Because link-hiding is not security, I logged in as each persona in an isolated browser context and called the API directly with that persona's session cookie. I extracted the app's own role matrix from the DOM (`/staff` → "What each role can open" tab, which the app states is "taken from the app itself") and compared it to observed HTTP status codes.

### 2.2 Observed enforcement (HTTP status per role)

| Endpoint | Owner | Doctor | Front desk | Nurse | Clinic admin |
|---|---|---|---|---|---|
| `/api/me` | 200 | 200 | 200 | 200 | 200 |
| `/api/queue?doctor=all` | 200 | 200 | 200 | 200 | 200 |
| `/api/patients?view=list` | 200 | 200 | **200** ⚠ | 200 | 200 |
| `/api/rx-desk` (prescriptions awaiting print) | 200 | 200 | **200** ⚠ | 403 | **200** ⚠ |
| `/api/inbox` | 200 | 200 | 403 | 403 | 403 |
| `/api/templates` | 200 | 200 | 403 | 403 | 403 |
| `/api/doctors` | 200 | 403 | 403 | 403 | 200 |
| `/api/staff?view=team` | 200 | 403 | 403 | 403 | 200 |
| `/api/reports` | 200 (`clinical:true`) | 200 (`clinical:true`, auto-scoped to own doctor id) | 403 | 403 | 200 (`clinical:false`) |
| `/api/invoices` | 200 | **200** ⚠ | 200 | 403 | 200 |
| `/api/dayclose` | 200 | **200** ⚠ | **200** ⚠ | 403 | 200 |
| `/api/lab` | 200 | 200 | 200 | 200 | 403 |
| `/api/branches` | 200 | 200 | 200 | 200 | 200 |
| `/api/messages` (patient SMS log) | 200 | **200** ⚠ | 200 | 403 | 200 |
| `/api/subscription` | 200 | 403 | 403 | 403 | 200 |
| `/api/tele` | 200 | 200 | — | 403 | 200 |
| `/api/schedule/agenda` | 200 | 200 | — | 403 | 200 |

`403` bodies are clean and correct: `{"error":"Your role cannot do this"}`, `{"error":"Your role cannot see reports"}`, `{"error":"Your role cannot see lab work"}`, `{"error":"Your role cannot see teleconsults"}`. **Server-side enforcement is real** — this is not a cosmetic RBAC.

### 2.3 The app's own matrix (extracted from the DOM)

| Area | Front desk | Nurse | Clinic admin | Doctor |
|---|:---:|:---:|:---:|:---:|
| Patient Kiosk | ✓ | — | ✓ | ✓ |
| Nurse Station | ✓ | ✓ | ✓ | ✓ |
| Doctor Console | ✓ | ✓ | ✓ | ✓ |
| Reception Desk | ✓ | — | ✓ | ✓ |
| Billing & POS | ✓ | — | ✓ | ✓ |
| Lab & Diagnostics | ✓ | ✓ | — | ✓ |
| Teleconsult | ✓ | — | ✓ | ✓ |
| Appointments | ✓ | — | ✓ | ✓ |
| Patients | ✓ | ✓ | ✓ | ✓ |
| Patient messages | ✓ | — | ✓ | ✓ |
| Settings | ✓ | ✓ | ✓ | ✓ |
| Reports | — | — | ✓ | ✓ |
| Doctors | — | — | ✓ | — |
| Staff & roles | — | — | ✓ | — |
| Locations | — | — | ✓ | — |
| Subscription | — | — | ✓ | — |
| Inbox | — | — | — | ✓ |
| My templates | — | — | — | ✓ |
| Diagnoses, notes and prescriptions | — | — | — | ✓ |

> "The doctor who owns the clinic also gets everything in the Clinic admin column." — `/staff`, in-app.

### 2.4 Findings

**F1 — HIGH · Clinical data reaches the front desk despite `records:false`.**
`GET /api/me` for Priya Shetty (Front desk) returns `"can":{"manage":false,"records":false,"billing":true,"vitals":false,"queue":true}`. Yet:

```
GET /api/patients?view=list&filter=all&q=  →  200
{ "id":"pt_93df…", "name":"Reyansh Sharma", "sex":"M", "age":25,
  "phone":"••••• 28051", "abha":false, "allergies":"",
  "conditions":["Heart disease"], … }
```

`conditions` and `allergies` are present in the front-desk payload. The Patients screen renders them as chips — I observed the list showing `Heart disease`, `High BP`, `Thyroid`, `Diabetes`, `Allergy: Sulfa drugs`. **Allergy information exposed to the front desk is the most clinically consequential instance**: a receptionist who cannot read allergies but can see "Sulfa drugs" may read it as a billing note. The stated spec for front desk is *"No clinical notes"*; `conditions`/`allergies` are clinical content.

The same endpoint returns `conditions` to the **Clinic admin** role, whose spec is *"No clinical records"* (`"records":false` confirmed in `/api/me`).

The queue endpoint partially strips by role — reception received `"vitals":{}` while the owner received the full vitals set — **but** reception still received `"symptoms":["Cough","Chest pain"]`, `"redFlags":["Chest pain"]`, `"severity":9`, `"reason":"Fever"` and `"nurseNote"`. So field-level stripping exists in one place and not in the other, which suggests the strip was written for vitals specifically rather than as a general policy.

**This contradicts a written commitment, which raises the severity from "spec drift" to "contract breach".** The published **Data Processing Agreement** (`/legal/dpa`, v1.0, effective 16 Nov 2026) states in §4 (Security):

> *"Access follows roles: front desk and admins cannot read clinical notes."*

The front desk and the admin both receive `conditions` and `allergies` for every patient today. Whether "clinical notes" is meant to exclude `conditions` is arguable, but the DPA also says *"the activity log cannot be edited"* and *"screens lock after inactivity"* as positive security claims — so the document is being used as a security promise. Either the implementation changes or the sentence does; shipping both as-is is the worst option.

**Fix:** enforce `records` centrally in the data layer, not per-endpoint. Strip `conditions`, `allergies`, `symptoms`, `redFlags`, `severity`, `reason`, `nurseNote` for roles without `records`, and expose a redacted projection (`name, age, sex, token, status, doctor, wait`) for the queue and patient list.

**F2 — HIGH · No cover-for-colleague path.**
`GET /api/visits/:id` is served to any role with the visit in scope, but `GET /api/prescriptions` returns 403 to any doctor who is not the assigned doctor. As the clinic **owner**, opening a patient assigned to Dr. Iyer produced:

> *"Only the doctor treating this patient can write the prescription"* — [Back to queue]

with an unhandled console `403`. There is no owner override, no reassignment, and no "consult on behalf of Dr. Iyer". In real clinics this is daily: the doctor is on leave, in a camp, running late, or the patient arrived for the wrong doctor. **Recommendation:** add a `POST /api/visits/:id/claim` (take over, with a reason) available to the assigned doctor, the owner, and admins; log it to the activity log; and show the owner an explicit "Reassign / Take over" button.

**F3 — HIGH · Sign-in rate limit is IP-based, not phone-based.**
`POST /api/auth/otp` returned `429 {"error":"Too many tries. Please wait a little and try again."}` for numbers I had **never used** (`9000000005`, `9000000006`) in the same minute in which a *different* number still succeeded — so the limiter is keyed on **source IP**, not on the phone number. Consequences:

- One person hammering "Send code" locks **every** staff member out of the dashboard for the window. Indian clinics run on one shared NAT'd office connection, so this is the normal case, not an edge case.
- The response carries **no `Retry-After`** header and the UI shows no countdown — the user is told to "wait a little" and must re-enter their mobile number from scratch.
- The walk-in kiosk uses the **same OTP endpoint** for patients. A burst of patient check-ins can therefore block staff sign-in, and vice versa.

**Fix:** key the limiter on `(phone, ip)` pairs with separate buckets for staff and patient flows; return `Retry-After`; render a live countdown; and exempt the kiosk device.

**F4 — MEDIUM-HIGH · Module-level RBAC only, and the matrix contradicts the documented spec.**
The enforced matrix (§2.3) is coherent and correctly server-enforced, but it does not match the persona brief supplied for this review:

| Persona | Brief says | App actually grants |
|---|---|---|
| Front desk | Kiosk, queue, appointments, reception, billing, lab, teleconsult — **no clinical notes** | all of the above **plus Doctor Console, Nurse Station, Patients** (with `conditions`/`allergies`) |
| Nurse | Nurse station, queue, lab — **no prescriptions** | plus **Doctor Console, Patients, Settings**; prescriptions correctly denied |
| Clinic admin | Billing, reports (non-diagnostic), doctors, staff, locations, settings — **no clinical records** | plus **Kiosk, Nurse Station, Doctor Console, Reception Desk, Teleconsult, Appointments, Patients**; `rx-desk` returns 200 |
| Doctor | Doctor console, prescriptions, patients, inbox, templates, personal reports | plus **Kiosk, Nurse Station, Reception Desk, Billing, Lab, Teleconsult, Appointments, Patient messages, Settings**; and *clinic-wide* invoices/day-close/queue (F5) |

Two possible root causes: the brief is stale, or the app over-grants. Either way **the app's own matrix is the only source of truth and should be re-signed-off**, because it is what the customer sees. Two specific mismatches to resolve with intent:
- **Front desk + Nurse + Admin can open the Doctor Console.** If the console is read-only for them, say so; otherwise hide it.
- **Clinic admin can open `rx-desk`** (prescriptions waiting to be printed) while the *nurse* cannot. Prescriptions are clinical records; that is backwards relative to the "admin has no clinical records" rule.

**F5 — MEDIUM · Cross-doctor scope leakage for non-owner doctors.**
`GET /api/reports` is correctly auto-scoped: a request with `doctor=all` from Dr. Shenoy silently returned `"doctor":"st_shenoy"`. **The same discipline was not applied** to:

- `GET /api/invoices` → every invoice in the clinic, including other doctors' revenue lines and patient names (`"doctor":"Dr. Vikram Shenoy"`).
- `GET /api/dayclose` → clinic cash/UPI/card totals **and a per-doctor breakdown** (`byDoctor: {"Dr. Vikram Shenoy": 600}`).
- `GET /api/queue?doctor=all` → every doctor's queue with complaint reasons and vitals.
- `GET /api/patients?view=list&filter=all` → all patients, with `conditions`.
- `GET /api/messages` → the whole clinic's patient SMS log.

A salaried doctor should see their own patients and their own earnings, not the clinic's P&L and every colleague's patient list. **Fix:** apply the same `doctor=me` coercion already used by `/api/reports` to invoices, day-close, queue and patients for non-owner doctors, and add a separate explicit "Clinic-wide view" toggle for owners/admins with an audit entry.

### 2.5 Security positives worth keeping

- **Device-level kiosk lock.** `POST /api/auth/lock {"mode":"kiosk"}` moved the session into patient-kiosk mode; every staff API then returned **`423 Locked — {"error":"This device is a patient kiosk"}`** and staff routes redirected to `/kiosk`. Exit requires the PIN of the person who opened the kiosk (`"Staff only. Enter the PIN of the person who opened it."`). This is a genuinely strong control that most competitors do not have.
- **Per-user OTP + personal PIN + named audit log.** The app actively steers against shared logins ("Sharing one login hides who did what, so give each person their own").
- **Clean 403 semantics** with role-specific messages, and `records`/`clinical` flags already modelled in `/api/me`.
- **Masked patient phone numbers** in list payloads (`••••• 28051`).
- **Terminology/promise hygiene:** the Terms document states *"You can stop at any time and take a copy of your clinic's records with you"* — this must be true (see §4, Gap 4).
- **Clean unauthenticated behaviour.** With no session, every staff endpoint returns `401 {"error":"Please sign in again"}` — never data, never a stack trace.
- **Public booking API is properly isolated and minimally exposed.** `GET /api/public/doctors?clinic=other-clinic` → `404 {"error":"We couldn't find that clinic. Check the booking link with your clinic."}`; an unknown doctor → `404 {"error":"Doctor not found"}`. The public payload exposes only **name, speciality, clinic/online fees and next free slot** — no phone numbers, no schedule detail, no patient data.
- **The kiosk ticket is a signed token.** `POST /api/kiosk` takes `{"ticket":"eyJ2Ijoi…"}` — a signed JWT rather than raw client-supplied state, so a patient cannot forge their way into the queue.

### 2.6 Other security observations

- **Cleartext staff and doctor mobiles** are returned by `/api/doctors` and `/api/staff` (`"phone":"9845012345"`) to admins. Justified for a clinic admin, but there is no role narrower than "admin" — a "practice manager" role would want staff records without the full team directory.
- **Patient phone in cleartext** on the patient record screen (`9845328051`) — appropriate for clinical use; note it must not appear on the public booking page.
- **Unknown API paths return the marketing HTML page** as a 404 (8.7 KB of HTML) instead of a JSON error. That breaks API clients and leaks the landing page into an API response. Return `{"error":"Not found"}` for `/api/*`.
- **Unhandled errors in console** for expected denials: 12 console errors accumulated while the session was in kiosk mode, plus the 403 on the consult page. Wrap fetches so a denied call logs a single handled warning rather than an unhandled rejection.
- **Demo mode is well signposted:** a persistent banner — *"Test mode for eSign, ABDM, payments: signatures and payments here are not real. Add the live keys before treating patients."* — plus `/api/me.integrations` = `{"esign":"test","abdm":"test","payments":"test"}`. Keep this banner on the demo deployment; **remove it only when the live keys are actually connected**.

---

## 3. Workflow efficiency — end-to-end

### 3.1 The two journeys the app is designed around

**In person (verified):** `Kiosk → Nurse vitals → Doctor → e-Sign → Reception prints`
**Online:** `Teleconsult → Video call → Doctor → e-Sign → SMS link and ABHA`

**The in-person chain works, and I walked it.** As a patient I completed the kiosk: mobile → OTP → patient details → reason → doctor (with live wait) → fee → **token W-03 issued before payment**. The kiosk then displayed *"Dr. Ananya Rao · General Medicine · Room 2 · 1 waiting · about 10 min"* — the new walk-in was visible to waiting patients within one polling cycle, and the wait estimate had updated. The write path is `POST /api/kiosk {"step":"walkin","ticket":"<signed JWT>","doctorId":"st_rao","reason":"","patient":{…}}` — the ticket is a signed token, not raw client input. Good.

### 3.2 Bottlenecks and dead ends

| # | Where | Problem | Impact |
|---|---|---|---|
| **D1** | Consult → other doctor's patient | Hard dead end (F2). | Doctor is blocked mid-shift with no route forward. |
| **D2** | Doctor console → checkout | Consultation ends at "Sign & send to reception"; the doctor must then rely on the front desk to print and collect. There is **no "prescription ready" notification** observed for the patient (the SMS log's observed kinds were token/turn-related). The patient sits in the waiting room without being told their Rx is ready. | Extra waiting time, and reception becomes the bottleneck. |
| **D3** | Kiosk → queue | The kiosk's "DOCTORS TODAY" list showed **only Dr. Ananya Rao and Dr. Vikram Shenoy**, while Dr. Meghana Iyer had an active waiting patient (W-01, Room 1). The kiosk's own API confirms this is server-side, not a rendering bug: `GET /api/kiosk` returns exactly two doctors — `st_shenoy` (waiting 0, waitMin 0) and `st_rao` (waiting 1, waitMin 10) — and **`st_iyer` is absent from the payload entirely** even though she holds a queue entry. The list is therefore schedule/roster-driven, not presence-driven, so a patient at the front door cannot choose the doctor who is actually seeing patients. **Fix:** drive the kiosk list from the live duty roster (who is in clinic now), not from a static schedule. | Misrouting at the front door. |
| **D4** | Kiosk → payment | `integrations.payments = "test"`, so "Pay ₹500 by UPI" is non-functional in the demo, and the fallback is "Pay at the front desk" — i.e. the kiosk's step 5 ends at the front desk anyway. | Kiosk self-service stops one step short of the value proposition. |
| **D5** | Kiosk → idle reset | 8-second warning, then the partially entered patient form is wiped (W6). | Elderly/slow patients lose their form and restart. |
| **D6** | Kiosk → exit | Leaving kiosk mode requires the PIN of whoever opened it; no documented fallback if that person is off-site. | Device stranded in kiosk mode → effectively down for the clinic. |
| **D7** | Front desk checkout | "Reception Desk" and "Billing & POS" are two nav destinations, and Billing also appears as a section inside `/desk`. The desk copy says *"Check each patient out in one place: prescription, payment, follow-up and lab sample"*, but the billing module is a separate top-level nav item with its own dashboard. | The "one place" promise is diluted by duplicate navigation. |
| **D8** | Nurse → routing | The nurse station has `Need vitals / Ready / All` tabs and a "route to the right doctor" concept, but the routing action was not exercised (rate limit). The kiosk, by contrast, lets the *patient* choose the doctor — if the nurse's routing is meant to override patient choice, that is a conflict to resolve. | Unverified; resolve before launch. |
| **D9** | Every screen | 10-second polling on queue/nurse station + full-nav prefetch storms (W8). | Latency on low-end clinic tablets. |

### 3.3 Where the workflow is *better* than competitors

- The patient's journey is **one screen** (kiosk) rather than a paper register plus a queue sheet plus a WhatsApp message to the doctor.
- The reception handover is **structured**: the signed prescription arrives at `/desk` as a task with a checklist (print Rx, collect fee, book follow-up, collect sample), not as an ambiguous "someone was seen".
- The doctor is handed a **triage brief, not a blank form** — vitals, red flags and severity pre-loaded and timestamped ("Nurse's vitals — 1:00 pm").
- Emergencies are first-class: `priority: "emergency"`, `redFlags: ["Chest pain"]`, `severity: 9`, an emergency badge in the queue, and "Emergencies and urgent patients come first" on the nurse station.
- Follow-up, lab sample collection and the fee are captured **inside** the consultation, so the front desk receives a complete instruction set rather than three separate loose ends.

---

## 4. Market gap analysis

Competitive and regulatory research was run in parallel with the hands-on audit (full source list at the end of this file). Prices and features were verified on vendor pages on 17 Nov 2026.

### 4.1 The market MedMate is in

| Segment | Vendors | Typical price |
|---|---|---|
| **Queue/token only** | OPDly, Treatlly, Cufront, E-Token, MedPrax OPD, NoQueue | ₹499 – ₹2,999 / month |
| **Clinic management / EMR (India)** | Practo Ray, Eka Care, HealthPlix, HealthRay, Clinicea | ₹12,000 – ₹1,00,000 / year |
| **Full ambulatory EHR (global)** | eClinicalWorks, Tebra, CareCloud | $499 – $799 / provider / month |
| **Practice management (global)** | Jane, SimplePractice, Medesk | $49 – $99 / month (solo) |

MedMate is aiming at the second segment while being feature-competitive with the first and fourth. Its real differentiators against Indian peers are: **clinical depth** (a genuine consultation form, examination systems, ABDM/FHIR/e-sign positioning) and **workflow depth** (kiosk → nurse → doctor → reception → billing on one system). Its real weaknesses against Indian peers are: **patient channel**, **messaging channel**, **ABDM depth**, and **per-doctor scoping**.

### 4.2 Missing features, ranked by evidence of demand

1. **Patient portal / mobile app** — self-booking, pre-registration, reports, prescriptions, dues, payments. Present in Jane, SimplePractice, Medesk, eCW healow, Practo Pro, HealthPlix, Apollo Doctor. MedMate has a booking page, not a portal. **This is the biggest single gap.**
2. **WhatsApp-first messaging** — reminders, Rx, reports, bills. Eka meters it at ₹1/message; MedPrax/HealthPlix send Rx and reports over WhatsApp; Practo Ray's SMS-only gap is a recurring complaint. In India, WhatsApp is the default patient channel. MedMate has SMS only, and **the SMS gateway is not even connected** (`smsReady:false`, 8 messages `not_set_up`).
3. **ABHA creation + verification + QR scan at reception + record linking.** Mandatory for clinics in the ABDM MVP guidance. MedMate *references* ABHA (patient record shows `Link ABHA`, `ABHA not linked`, and the marketing page claims "Patient records only with ABHA consent") but I found **no ABHA creation/verification flow and no consent-capture step** in the walk-in, consult or booking paths. Either the flow exists behind a feature flag or the claim is ahead of the implementation — **must be reconciled before any ABDM claim is printed on a brochure.**
4. **FHIR R4 structured export + SNOMED CT / ICD mapping + data migration in/out.** Mandatory for clinics from 1 Apr 2023. MedMate's Terms promise *"take a copy of your clinic's records with you"* but the only export I found is Excel from Reports. **Promise-vs-implementation gap** — and broken exits are a top-3 churn driver in this market.
5. **Live UPI collection with a published MDR.** Indian peers compete on **0% commission** (Treatlly) vs Practo's 1.8–2%; global peers charge 2.85–3.15% + a fixed fee. MedMate must publish its MDR; `payments: "test"` must become a real gateway.
6. **Drug interaction / allergy / dose validation surfaced at prescribing.** The Terms claim the app shows "(doses, tests, interactions)" and `/api/visits/:id/suggestions` exists — **verify coverage depth** against the claims. Generic-name-first prescribing is mandated by the 2002 IMC regs (reg 1.5) and is an easy, high-trust win.
7. **Recall, reminders and no-show control.** Practo Ray claims >70% no-show reduction from reminders; Jane automates waitlist and return-visit reminders. MedMate has a booking flow and reminders in the SMS log but no waitlist, no recall and no no-show analytics beyond a counter.
8. **Patient access to their own dues and reports** — removes the front desk's chasing work (the "₹500 still to collect" case).
9. **TPA / corporate billing and instalments** — the India-shaped version of insurance billing (Plato has this module).
10. **Lab order → external lab integration** (Thyrocare, Metropolis, SRL, Redcliffe). MedMate's `/api/lab` already returns `"partners":["Tenet Diagnostics","MediDocs"]`, so a partner concept exists — confirm whether orders/results actually flow.
11. **AI scribe / ambient note capture** — the fastest-growing paid add-on in this market (Jane $15/practitioner, SimplePractice $35, eCW Sunoh.ai). A scribe frees the doctor from typing; MedMate's tap-based examination is 70% of the way there.
12. **Owner-grade analytics** — no-show rate, wait-time distribution, doctor-wise revenue, treatment efficacy, referral source (Eka, Ketpy, Medesk all ship these).
13. **"Cover for colleague" / handover** (see F2) — not a competitor feature per se, but every Indian product has a loose equivalent and MedMate has a hard wall.

**Explicitly NOT missing (and should not be built for India):** US-style insurance claims / RCM / superbills / CMS-1500 / ERA (Jane $20 add-on, SimplePractice $0.39+/claim, eCW 2.9% of collections) — irrelevant to cash-pay Indian clinics. Keep only TPA + corporate + packages.

### 4.3 Feature bloat — what to cut or defer

| Keep / cut | Item | Reason |
|---|---|---|
| **Cut (move out of nav)** | **Subscription** page in the staff app | Vendor billing belongs in account settings. 3 of 5 roles get 403; it occupies a top-level nav slot. |
| **Cut (move into Settings)** | **Patient messages** (SMS ledger) as a nav item | It is an audit view, not a daily task. Keep the data, drop the menu slot. |
| **Defer / narrow** | **Lab & Diagnostics** as a full module | For clinics without an in-house lab this duplicates a vendor's LIS. Reduce to "order → result" unless the clinic owns the lab. |
| **Defer / narrow** | **Teleconsult as a built-in video product** | Building video competes with WhatsApp/Meet for free. The valuable half is the **digital Rx + ABHA push**, which MedMate already has. Ship the Rx, drop the call surface (or embed). |
| **Defer** | **My templates** (treatment protocols) | The advice library already compounds via "Add & remember", which captures most of the value with far less build. |
| **Defer** | **Locations** as a dedicated nav item | 2 locations today; make it a Settings tab. |
| **Cut from the dashboard** | **9 station cards + 3 doctor consoles + 10 manage links on one screen** | Replace with four role landing pages (W1). This is the bloat that matters. |
| **Keep** | Staff & roles + RBAC matrix + activity log | Differentiating, cheap, and compliance-supporting. |
| **Keep** | Reports' "Worth a look" insight lines | Differentiating against ₹499 queue tools. |
| **Keep** | Consultation form, kiosk, reception handover | The core. |

### 4.4 Pricing and packaging

**Market norms (verified):** per-practitioner (Jane, SimplePractice, eClinicalWorks), per-clinic-flat (NoQueue, Cufront, Treatlly) and per-seat (Eka, E-Token) all coexist. **Admin and front-desk seats are normally free** — Jane explicitly: *"admin or support staff… free of charge"*; SimplePractice bills schedulers at no extra cost. Base plan + paid add-ons is the norm; usage metering on top (per message, per minute, per GB) is common; 18% GST applies and most Indian vendors quote ex-GST; Indian vendors push 1–4 year commitments while some offer a permanent free tier.

**Recommendation for MedMate:** per-clinic base + per-doctor, **front-desk and nurse seats free** (charging per reception seat is a non-starter in this market), unlimited locations only on the top tier, and publish the MDR. Observed `/api/subscription` already returns a structured plan (`plan: "trial"`, `daysLeft: 14`, `limits: {doctors:5, locations:3…}`, `usage: {doctors:3, staff:3, locations:2}`), so the pricing model exists and needs packaging, not building.

### 4.5 India compliance checkpoints for V1

| Requirement | Source | Status in MedMate |
|---|---|---|
| ABHA creation, verification, QR profile sharing, record linking, **FHIR R4** (mandatory 1 Apr 2023), SNOMED CT, ICD mapping, audit trail, encryption at rest, **data migration in/out** | ABDM MVP Guidance v3.0 | ABDM/HPR/HFR referenced; **FHIR export, SNOMED/ICD mapping and a full data export were not found.** Verify. |
| Facility ID (HFR) | ABDM milestones M1–M4 | `hfr_id` present on branches (`IN2910000123`) ✔ |
| Prescriptions must show the doctor's **State/NMC registration number**; a copy must be sent to the patient | Telemedicine Practice Guidelines ¶3.2.5, ¶3.6.4.2 | `reg_no: "KMC 84213"` on the doctor record ✔ — verify it prints on the Rx and the SMS copy |
| Digital-only prescriptions need a **Class 2 DSC / digital signature** (IT Act ss.4–5) | IT Act analysis | `sign_method: "dsc"`, `dsc_expiry` present; `integrations.esign = "test"` — live key required |
| AI must not counsel or prescribe | TPG ¶5.4 | The doctor signs everything ✔ — keep the wording |
| DPDP 2023 + DPDP Rules 2025: clinic = Data Fiduciary, vendor = Data Processor, valid processing contract, consent in plain language, **withdrawal as easy as giving**, breach intimation to the Board **and each affected Data Principal**, DPO for Significant Data Fiduciaries, children's verifiable parental consent | DPDP Act ss.5–10; DPDP Rules 2025 | Activity log + audit trail ✔; **no consent-capture UI observed**; Terms v1.0 is labelled *"draft awaiting legal review"* — **do not ship that in production** |
| Generic-name-first prescribing | 2002 IMC regs reg 1.5 | Formulary search accepts brand or salt ✔ — verify the printed Rx prefers generic |
| Ethical advertising of clinic content (effective 6 Oct 2026) | NMC | Marketing claims must match shipped behaviour — see Gap 3 |

### 4.6 Churn drivers to design against


Evidence from this market's review data, ranked: (1) slow/unreliable UI — 96% negative sentiment on "frequent slowdowns and lag" for eClinicalWorks; (2) support that never answers — 78% of 85 Tebra support mentions negative; (3) data migration and fear of switching — 44.8% of users cite fear of migration problems as a reason to stay; (4) broken exits — exports that don't work, then a fee to get data back; (5) billing complexity; (6) staff non-adoption and insufficient training — 41.8% of frontline staff expected a new EHR to take longer; (7) contract/price lock-in; (8) mobile-app bloat.

**Direct implications for MedMate:** the kiosk is its answer to (1) and (8) — protect its speed. The role landing pages (W1) and per-person logins are its answer to (6). The Terms' data-copy promise must be real (Gap 4) or it becomes a (4) complaint at renewal.

### 4.7 Written commitments vs. observed behaviour

MedMate publishes three legal documents (`/legal/terms`, `/legal/dpa`, `/legal/declaration`, all "Version 1.0 · effective 16 November 2026 · **draft awaiting legal review**"). They are unusually well written — they correctly assign Data Fiduciary / Data Processor roles, cite the DPDP Act 2023, the IT Act 2000 and its 2011 rules, ABDM's Health Data Management Policy, the Telemedicine Practice Guidelines 2020 and the 2002 IMC regs. Two risks follow from being this precise:

| # | Written commitment (source) | Observed | Verdict |
|---|---|---|---|
| **L1** | *"Access follows roles: front desk and admins cannot read clinical notes."* (DPA §4) | Front desk and admin both receive `conditions` and `allergies` for every patient (`GET /api/patients?view=list`) | **Contradicted** — see F1 |
| **L2** | *"MedMate helps: the kiosk and the patient's symptom form show what the data is used for."* (DPA §3) | The kiosk patient step asks name / age / sex / allergy with **no data-use notice** on screen. **Verify on the live build before claiming it.** | **Apparently contradicted** |
| **L3** | *"You can stop at any time and take a copy of your clinic's records with you."* (Terms) + *"We return your data on request and delete it within 30 days."* (DPA §9) | The only export I could **exercise** was Excel from Reports. An unauthenticated route probe shows **`/api/patients/export` exists** (`401 Please sign in again`), but no route exists for `/api/export`, `/api/export/records` or `/api/backup`, and there is no sign of an export covering **invoices, prescriptions, activity logs and messages**. **Verify what a full-records copy actually contains before making this promise.** | **Partially implemented** |
| **L4** | *"Your Settings page shows where your data is stored; demo sites may use a data centre outside India and must hold demo data only."* (DPA §6) | Settings could not be read (OTP rate limit — §1.3). The demo runs on Netlify, which is outside India, so the demo is compliant with its own carve-out **only if it holds demo data only**. | **Unverified — check** |
| **L5** | *"every opening of a patient's record is logged and the log cannot be edited"* (DPA §4) | The activity log is real, named and timestamped. I could not verify the *immutability* claim (no write path tested). | **Partially verified** |
| **L6** | *"Data is encrypted in transit; sign-ins use one-time codes and personal PINs; screens lock after inactivity"* (DPA §4) | OTP ✔, PIN ✔, inactivity lock ✔ (idle reset verified on the kiosk), HTTPS ✔. The kiosk **device lock** (423) is stronger than the DPA claims. | **Verified** |
| **L7** | *"We do not use it for advertising, profiling or training models for others, and we never sell it."* (DPA §2) | Nothing observable either way from the product. Requires a policy and log review, not a UI check. | **Out of scope of this audit — verify contractually** |

**Action:** treat L1–L4 as release blockers alongside F1–F3. A document that says "front desk and admins cannot read clinical notes" is a commitment a customer will hold you to, and the DPDP rules require the consent/notice story to be real rather than nominal. Either close the gap in code or soften the claim — but do not ship a draft that over-promises.

### 4.8 Two product claims to verify before they reach a brochure

- **"Patient records only with ABHA consent"** (login page). I found `Link ABHA` and `ABHA not linked` on the patient record and `hpr_verified: true` on the doctor, but **no ABHA creation/verification flow and no consent-capture screen** in the walk-in, consult or booking paths.
- **"Signed e-prescriptions as FHIR records"** (login page). The e-sign flow is present (`sign_method: "dsc"`, `dsc_expiry`) but the integrations are `esign: "test"`, `abdm: "test"`, `payments: "test"` and no FHIR payload endpoint was observed. Given NMC's 13 Oct 2026 guidance on remote authentication of clinical records, the FHIR/e-sign story is now a **selling point** — it needs to be real, not just worded.


---

## 5. Recommended roadmap

### 5.1 Now — security & correctness (before any paying clinic)

> **Remediation status.** Two fix packages for the High findings are written, tested and ready to apply — see `fixes/README.md`:
> - **F1 (+F5)** — `fixes/rbac-policy.ts` + `fixes/rbac-policy.test.ts` (16 tests, passing). One central policy module that strips clinical fields for roles without `records` and coerces cross-doctor queries to the signed-in doctor. Fixes the DPA §4 contradiction.
> - **F3** — `fixes/otp-rate-limit.ts` + `fixes/otp-rate-limit.test.ts` (8 tests, passing). Two-tier limiter keyed on `(scope, phone, ip)` with separate staff and kiosk buckets, `Retry-After`, and a countdown. This is the direct cause of the `429` errors seen during this audit.
>
> The full plan, with a per-feature completion percentage and a progress-tracking mechanism, is in `DEVELOPMENT-ROADMAP.md`.

| # | Action | Effort |
|---|---|---|
| 1 | Enforce `records` centrally: strip `conditions`, `allergies`, `symptoms`, `redFlags`, `severity`, `reason`, `nurseNote` for roles without `records`; return a redacted patient/queue projection for front desk. | 1–2 days |
| 2 | Resolve the Doctor Console / `rx-desk` grants for front desk, nurse and admin. Hide the console from non-doctors or make it read-only. | 1 day |
| 3 | Add `POST /api/visits/:id/claim` + owner takeover, with an activity-log entry and a "Take over / Reassign" button (F2/D1). | 2 days |
| 4 | Re-key the OTP limiter on `(phone, ip)` with separate staff/patient buckets; add `Retry-After`; render a countdown; exempt the kiosk device (F3). | 1 day |
| 5 | Apply the `/api/reports` doctor-coercion pattern to invoices, day-close, queue and patients for non-owner doctors (F5). | 1 day |
| 6 | Return JSON for unknown `/api/*` paths; stop logging expected 403s as unhandled console errors. | 0.5 day |
| 7 | Re-sign the role matrix against the persona spec and publish one authoritative matrix (in-app + docs). | 0.5 day |
| 8 | Replace the ToS "draft awaiting legal review" with counsel-reviewed DPDP data agreement + consent screens before any live patient data. | 1–3 weeks (external) |

### 5.2 Next — speed & focus (the biggest perceived win)

9. **Role landing pages.** Doctor → "Your queue" + "Waiting for you" + handover list. Reception → "At the desk" + "To collect" + today's bookings. Nurse → "Need vitals" (default) + "Ready". Admin → "Money today" + exceptions (unbilled, no-shows, staff activity). One click instead of three.
10. **Doctor override + queue handoff**: `Call next`, `No-show`, `Reassign`, and a visible "covering for Dr. X" banner.
11. **Patient notification when the Rx is signed** ("Your prescription is ready — please collect at the desk"), closing D2.
12. **Global patient search** (⌘K / one-tap field) across name/mobile/ABHA.
13. **Disable nav prefetch** for secondary routes; lazy-load stations; keep the 10s poll but only when the tab is visible.
14. **Kiosk fixes**: 30–60s idle grace with a visible countdown, preserve entered data across the warning, add accessible names/`aria-pressed`, honour `prefers-reduced-motion`, and provide an OTP-based kiosk exit fallback.
15. **Verify the kiosk doctor list is presence-driven**, not roster-driven (D3).

### 5.3 Then — commercial & channel

16. **WhatsApp channel** + a connected SMS gateway (Gap 2). In India this is table stakes.
17. **Patient app / PWA portal** — the single biggest gap vs competitors (Gap 1).
18. **ABHA creation/verification + consent capture + FHIR R4 export + full data export** (Gaps 3, 4) — these are what let you sell to hospitals, labs and corporates, and they close the Terms' data-copy promise.
19. **Live UPI with published MDR** + packages/instalments for chronic care.
20. **AI scribe** for the consultation note, built on the tap-based examination already in place.
21. **Recalls, waitlist and no-show analytics** (Gap 7).
22. **Packaging**: per-clinic + per-doctor, free front-desk/nurse seats, published MDR.

---

## Appendix A — API surface observed

| Group | Endpoints |
|---|---|
| Auth / session | `POST /api/auth/otp`, `POST /api/auth/verify`, `POST /api/auth/lock`, `GET /api/me` |
| Queue | `GET /api/queue?doctor=me\|all` |
| Visits & consultation | `GET /api/visits/:id`, `GET /api/visits/:id/brief`, `GET /api/visits/:id/suggestions`, `POST /api/visits` (405 on GET — route exists), `POST /api/prescriptions` |
| Patients | `GET /api/patients?view=list&filter=all\|mine&q=`, `GET /api/patients/:id`, `GET /api/patients/export` (401 unauthenticated — route exists) |
| Clinical reference | `GET /api/formulary`, `GET /api/medicines?warm=1`, `GET /api/tests`, `GET /api/pharmacies`, `GET /api/clinic-items?kind=diagnosis\|medicine\|advice`, `GET /api/templates` |
| Desk / billing | `GET /api/rx-desk`, `GET /api/invoices`, `GET /api/invoices/unbilled`, `GET /api/dayclose` |
| Diagnostics | `GET /api/lab` (returns `partners`) |
| Scheduling | `GET /api/schedule/agenda?day=&doctor=`, `GET /api/schedule/week?from=&doctor=` |
| Management | `GET /api/doctors`, `GET /api/staff?view=team`, `GET /api/branches`, `GET /api/messages`, `GET /api/subscription`, `GET /api/reports?from=&to=&doctor=`, `GET /api/tele`, `GET /api/inbox` |
| Public | `GET /api/public/doctors?clinic=`, `GET /api/public/slots?doctor=&day=&clinic=` |
| Kiosk | `GET /api/kiosk`, `POST /api/kiosk {step: code\|verify\|walkin}` |

## Appendix B — Capability flags per role (`GET /api/me`)

| | Owner | Front desk | Clinic admin |
|---|---|---|---|
| `manage` | true | false | true |
| `records` | true | **false** | **false** |
| `billing` | true | true | true |
| `vitals` | true | false | — |
| `queue` | true | true | — |
| `integrations` | `esign: test`, `abdm: test`, `payments: test` | same | same |

> `records:false` is **not** currently honoured by `/api/patients` — this is the root of F1.

## Appendix C — Sources (competitive & regulatory)

*Checked 17 Nov 2026. Only URLs that were actually fetched successfully are listed.*

**Vendors:** [practo-ray-plans](https://www.practo.com/providers/clinics/ray/plans) · [practo-ray](https://www.practo.com/providers/clinics/ray) · [eka-pricing](https://www.eka.care/practice-management/plan-pricing) · [healthplix-price](https://www.healthplix.com/pricing-1) · [jane-pricing](https://jane.app/pricing) · [sp-pricing](https://www.simplepractice.com/pricing/) · [ecw-pricing](https://www.eclinicalworks.com/products-services/pricing/) · [medesk-pricing](https://www.medesk.net/en/pricing/) · [plato](https://platomedical.com/features) · [plato-cm](https://platomedical.com/clinic-management/) · [zocdoc-pricing](https://www.zocdoc.com/provider-help/en/articles/10859404-understanding-zocdoc-pricing-and-billing) *(403 on direct fetch; content via search extraction — treat as unconfirmed-by-direct-fetch)* · [tebra](https://www.tebra.com/) · [carecloud](https://carecloud.com/practice-management/) · [noqueue](https://www.noqonline.in/for-doctors/) · [treatlly](https://www.capterra.com/p/10270343/Treatlly/) · [opdly](https://www.capterra.com/p/10267104/OPDly/) · [medprax](https://www.capterra.in/software/1327366/MedPrax-OPD) · [etoken](https://www.capterra.in/software/206231/e-token-solution) · [cufront](https://www.capterra.com/p/10048438/Cufront/) · [healthray](https://healthray.com/clinic-management-software/) · [apollodoctor](https://play.google.com/store/apps/details?id=com.apollo.doctorapp) · [ketpy](https://www.ketpy.com/products/ketpy-clinic) · [saronil](https://www.saronil.com/products/integrations/)

**Regulation:** [abdm-mvp](https://abdm.gov.in/strapicms/uploads/Approved_MVP_document_Version_3_b875b4b51e.pdf) · [abdm-milestones](https://docs.abdm.gov.in/docs/hiecm/v3/milestones) · [telemedicine-guidelines](https://nmcn.in/public/assets/pdf/Telemedicine%20Practice%20Guidelines.pdf) · [telemedicine-faq](https://www.aiims.edu/images/pdf/notice/FAQ_Telemedicine.pdf) · [it-act-analysis](https://www.vitels.in/blog/are-printed-and-digital-prescriptions-valid-india) · [nmc-tracker](https://www.vitels.in/nmc-rules-tracker) · [nmc-whatsnew](https://nmc.org.in/whats-new) · [dpdp-act](https://www.meity.gov.in/static/uploads/2024/02/Digital-Personal-Data-Protection-Act-2023.pdf) · [dpdp-rules](https://static.pib.gov.in/WriteReadData/specificdocs/documents/2025/nov/doc20251117695301.pdf) · [dpdp-faq](https://cms-induslaw.com/en/ind/publication/faqs-on-the-digital-personal-data-protection-act-and-rules)

**Reviews & analysis:** [zi-pvs](https://www.zi.de/fileadmin/Downloads/Service/Publikationen/Zi-Paper_32_FINAL.pdf) · [egms](https://www.egms.de/static/en/journals/mibe/2024-20/mibe000269.shtml) · [pmc-ehr-migration](https://pmc.ncbi.nlm.nih.gov/articles/PMC7153162/) · [ecw-reviews](https://www.capterra.com/p/120360/eClinicalWorks/) · [carecloud](https://www.softwareadvice.com/medical/carecloud-charts-profile/) · [rxnt](https://www.rxnt.com/6-best-tebra-alternatives-for-independent-practices-in-2026/) · [medsiteai](https://medsiteai.com/alternatives/patientpop) · [exahealth](https://www.exahealth.com/blog/practo-alternatives-for-clinics) · [capterra-isalus](https://www.capterra.com/p/144484/InSync-EMR/reviews/?page=2) · [healor-drchrono](https://healor.com/dr-chrono-it-cost-me-time-and-money/) · [capterra-dentrix](https://www.capterra.com/dental-software/trending-topics/is-it-worth-moving-a-small-dental-practice-off-dentrix-to-a-cloud-based-platform-when/) · [smartcustomer-zocdoc](https://www.smartcustomer.com/reviews/zocdoc.com) · [complaintsboard-zocdoc](https://www.complaintsboard.com/zocdoccom-predatory-one-side-business-to-scam-providers-c1982337)

**Uncertainty flags:** HealthPlix's per-doctor vs per-clinic basis is not stated on its price page; Practo Ray's GST treatment is not stated; Tebra / CareCloud / Plato prices are quote-based and not public; Zocdoc's fee matrix is not published; the NMC position on remote authentication of clinical records changed on 13 Oct 2026 and conflicts with a Feb 2025 RTI answer; DPDP compliance dates rely on a law-firm summary and should be confirmed against the Gazette. **No Indian review site has a statistically meaningful rating for the Indian clinic-software tier** (HealthPlix's G2 score rests on 3 reviews) — treat Indian competitor satisfaction claims as thin evidence.

---

*Audit performed by black-box exploration of the live demo. Findings F1–F12, D1–D9 and W1–W8 are reproducible with the credentials and the endpoint list in Appendices A–B.*
