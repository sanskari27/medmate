# MedMate — How the Whole Thing Works
### A plain-language guide, told as one day in a clinic

*Written to be read by anyone — a new receptionist, a doctor's family member, or a developer who wants the big picture in five minutes. No jargon. If a word is unavoidable, it is explained at the bottom.*

---

## The short version

**MedMate is a shared computer screen (or several) that a clinic uses to run its day.**

Instead of a paper register, a queue board, a prescription pad, a cash box and a phone call to the lab, everything happens in one place:

| Instead of this... | you use... |
|---|---|
| A paper queue register | the **Patient Kiosk** and the **Queue** |
| A nurse writing BP on a clipboard | the **Nurse Station** |
| A prescription pad | the **Doctor Console** |
| Calling the front desk to say "come print this" | the **Reception Desk** |
| A cash box and a bill book | **Billing & POS** |
| A WhatsApp group for lab reports | **Lab & Diagnostics** |
| A phone call for a video consult | **Teleconsult** |
| A wall calendar for appointments | **Appointments** |

---

## The people in the story

Imagine five people sharing one clinic. Each one sees a *different* version of the same screen, so nobody sees what they are not supposed to see.

| Person | Who they are | What they do all day | Which screen is "theirs" |
|---|---|---|---|
| **Dr. Ananya Rao** | The clinic owner. She is also a doctor. | Sees patients, writes prescriptions, and runs the whole business. | Everything |
| **Dr. Vikram Shenoy** | A doctor (paediatrics). | Sees his own patients, writes prescriptions, reads his own reports. | Doctor Console, Patients, Inbox, Templates |
| **Priya Shetty** | Front desk. | Greets people, gives out tokens, prints prescriptions, takes the money. | Reception Desk, Billing, Kiosk, Appointments |
| **Mary Joseph** | Nurse. | Checks blood pressure, temperature, weight; decides which doctor should see the patient. | Nurse Station, Queue, Lab Desk |
| **Kiran Bhat** | Clinic admin. | Looks after money, staff, branches and settings. No patient records. | Billing, Reports, Staff, Locations, Settings |

**The rule:** everyone signs in with **their own mobile number** and their **own 4-digit PIN**. MedMate writes down *who did what*. If Mary records a blood pressure, the log says "Mary Joseph recorded vitals for Reyansh Sharma". If Priya takes ₹500, the log says Priya took ₹500. That way nobody can blame the wrong person, and nobody can quietly look at a patient file they should not open.

---

# A Day in the Life

## 🌅 Evening before — the owner sets things up

**Dr. Ananya Rao** sits at her laptop in the evening and signs in.

She lands on the **Dashboard**. It greets her: *"Good afternoon, Dr. Ananya"*, and then tells her what needs attention:

> *"1 waiting · 0 awaiting vitals · 0 prescriptions to hand over · 0 appointments still to come today"*

Below that, the dashboard shows a row of cards — **"Open a station"** — because a patient walks through a clinic in a fixed order:

```
Step 1  Patient Kiosk    →  Step 2  Nurse Station  →  Step 3  Doctor Console  →  Step 4  Reception Desk
```

She also manages the clinic from the same place:

- **Doctors** — she adds each doctor using their **HPR ID** (a national government ID for doctors in India) and sets their **consultation fee** and **room**.
- **Staff & roles** — she adds Priya, Mary and Kiran and chooses what each role may open. There is a handy tab called *"What each role can open"* — a table with a tick or a dash for every area. The app says: *"This is taken from the app itself, so it always matches what each person sees after signing in."*
- **Locations** — Indiranagar and HSR Layout, with rooms inside each.
- **Settings** — the clinic's name, address, and the letterhead printed on prescriptions.
- **Reports** — how many patients, how much money, how long people waited.

That evening she also signs **her own prescriptions with a digital signature** (like a signature stamp, but legally valid), and links the clinic to **ABHA** — India's national health ID, so a patient's records can be found across different hospitals.

---

## 🌞 Morning — the clinic opens

### 8:45am · The first patient walks in

The patient has a fever. She has never used MedMate before.

At the **front desk there is a tablet showing the Patient Kiosk**. It says:

> **SELF CHECK-IN**
> Welcome
> Check in for your appointment, or see a doctor today. It takes about a minute.
> **Tap to check in** — *Or use your phone: Scan with your camera. No app needed.*

The screen is big, and it speaks **English, ಕನ್ನಡ and हिन्दी** — because a patient who cannot read English should still be able to check themselves in.

**The patient taps "Tap to check in."** A big on-screen keypad appears (not the tiny phone keyboard — easier for older eyes).

**Step 1 — Mobile.** She types her mobile number and presses **Send code**. A 6-digit code arrives by SMS. She types it.

**Step 2 — Patient.** The screen asks her name, age, sex, and *"Allergic to any medicine?"* — because if she is allergic to a medicine and the doctor prescribes it, that is a serious problem.

**Step 3 — Doctor.** The screen asks *"What brings you in?"* — Fever, Cough & cold, Stomach problem, Pain, BP/Sugar check, Skin problem, Follow-up, General check-up — or skip. Then: *"Choose a doctor."* There is a **Next available doctor** option (*"Usually the shortest wait"*) and a list of the doctors on duty with their room, their current wait, and their fee.

**Step 4 — Pay.** The screen says:

> Consultation fee · **Token W-03** · To pay ₹500
> **Pay ₹500 by UPI** · *Pay at the front desk*

**The token number (W-03) is the important part.** It is the patient's place in line. The kiosk prints it, sends it by SMS, and shows it on the waiting-room screen if one is connected. The patient now has a number instead of a vague "the doctor will call you soon".

### 9:00am · Mary, the nurse

**Mary Joseph** signs in on her station. She does **not** see the Doctor Console, the money screens or the settings — she sees:

> **Nurse station** — *Emergencies and urgent patients come first.*
> 0 Need vitals · 1 Urgent or emergency · 1 Ready for the doctor

The waiting patient appears under **"Need vitals"**.

Mary opens the patient's card and fills in:
temperature, blood pressure, pulse, oxygen level, breathing rate, blood sugar, weight. She also adds her own note, and taps if something looks wrong — she marks Reyansh Sharma as an **emergency** because of chest pain and a very high temperature.

Then she does the **routing**: she sends the patient to the right doctor. From now on, that patient belongs to that doctor's queue.

**What Mary deliberately cannot do:** she cannot write a prescription and she cannot see the money. Her job is vitals and routing, and the software keeps her out of everything else. (Even though the current build technically lets her open the Doctor Console and see patient conditions — see the audit report; this is the intended behaviour, not the shipped behaviour.)

### 9:10am · Dr. Iyer sees the patient

**Dr. Meghana Iyer** signs in and lands in her own **Doctor Console** — *not* a list of everyone's patients, but **her** queue:

> **Up next** · ROOM 1 · W-01 · Reyansh Sharma · 25 · M
> Waiting 38 min · **Emergency** · Chest pain, Cough, Acidity or heartburn, Headache
> 101°F · BP 123/87 · Pulse 120 · SpO₂ 95% · 80 kg · Sugar 180

This is the screen that matters most. Before the doctor types a single character, they already see **who, how bad, how long they have waited, what the nurse found, and what is worrying**.

She clicks the patient's name and the **consultation screen** opens. It is not a blank form. It is a **seven-step path**, in the order a doctor actually thinks:

| Step | What it asks | Why it is designed this way |
|---|---|---|
| **1. Complaints & history** | "Chief complaints" and "History" | The app tells the doctor: *"The complaints print; the history stays in the record."* Private detail stays private. |
| **2. Examination** | Tap findings by body system — General, Chest, Heart, ENT, Abdomen, Nervous system, Joints, Skin | **No typing.** Tap `+ Febrile`, `+ Crepitations`, `+ Guarding`. It pre-fills the nurse's vitals at the top. |
| **3. Diagnosis** | A search box ("Search or write, e.g. viral fever, J06.9") | It offers suggestions; it does not decide. |
| **4. Medicines** | "Search any brand or salt (Dolo, azithro 500…), or add your own" | Searches a **formulary** of real medicines. |
| **5. Tests** | "Search tests, e.g. CBC, lipid, TSH, USG abdomen, MRI knee" | Optional — a lab order in one tap. |
| **6. Advice** | Tap common advice lines ("Drink plenty of water", "Steam inhalation twice a day"), or type your own | "Add & remember" builds the doctor's personal advice library over time. |
| **7. Follow-up** | "3 days / 5 days / 1 week / 2 weeks / 1 month / 3 months", then a time | Books the next visit immediately. |

At the bottom there is a **Payment & bill** box that says what is owed, and then the last button:

> **Sign & send to reception**
> *"Last step · check the instructions for the front desk"*
> *Signing locks the prescription, sends the patient their copy by SMS and ABHA, and puts it on the Reception Desk with these instructions.*

Before she can press it, the app checks her work:

> **"Add a diagnosis, medicines or advice first."**

She fixes it, presses **Review & sign**, and signs with her digital signature. (Legally, the prescription must carry her **registration number** — `KMC 84213` — and the app keeps that with her profile so it always prints.)

**What happens in the background:** the prescription is locked, a copy is sent to the patient by SMS and to their ABHA record, a draft bill is created, and a task appears on the **Reception Desk**.

### 9:20am · Priya at the desk

**Priya Shetty** signs in. Her screen is about *people and money*, not medicine.

The **Reception Desk** says: *"Check each patient out in one place: prescription, payment, follow-up and lab sample. Oldest first."*

Reyansh Sharma's row appears with a checklist:

- ☐ **Print and hand over the prescription**
- ☐ **Collect the consultation fee**
- ☐ **Book the follow-up visit**
- ☐ **Collect the lab sample**

**Priya does not re-type anything.** Everything the doctor decided is already there — the prescription, the fee amount, the follow-up date, the tests to collect. Her job is to print, to take money, and to check boxes.

For payment she opens **Billing & POS**, which offers UPI, cash and card. She can add extra items (ECG, nebulisation, wound dressing), apply a discount with a reason, and print a receipt.

The **Billing** screen also shows the day's totals at a glance:

> Collected today ₹600 · UPI ₹600 · Cash ₹0 · Card ₹0 — To collect ₹500 (1 bill)

At the end of the day she does **Day close**: she types how much cash is in the drawer, and MedMate compares it with what it expected and tells her if anything is off.

**What Priya deliberately cannot do:** she cannot open the Doctor Inbox, the Reports, the Doctors list, the Staff list, the Templates, or the Subscription.

### 9:40am · The doctor says "call the next patient"

Dr. Iyer presses **call**. The patient gets an SMS ("Roni, it's your turn (token W-02)"). If she does not arrive, the doctor marks **No-show**, and that number shows up in the reports.

### 11:00am · A lab result comes back

Dr. Iyer's **Inbox** has three tabs: **To do**, **Lab results**, **Referrals**.

A lab result arrives with the abnormal ones flagged:

> **LAB RESULT** · Ravi Kumar · CBC and CRP · Apollo Diagnostics
> Haemoglobin 14.2 g/dL (13–17) ✓ · WBC count 11.8 ×10³/µL (4–11) **↑ High** · Platelets 245 (150–410) ✓ · CRP 18 mg/L (below 5) **↑ High**

The doctor can book the patient straight in, or "ask the patient to book".

A **handover** message from a colleague appears too:

> **HANDOVER** · From Dr. Vikram Shenoy — *"Leaving at 1 PM for a school health camp. Call Aarav Menon's mother with his CBC result when it comes in."*

And a **referral** arrives with a clinical question attached:

> **REFERRAL** · Lakshmi Narayan, 61F — From Dr. Meghana Iyer
> *"BP 146/92 at her gynaecology visit, already on amlodipine 5 mg. Please review her BP treatment and kidney function."*
> Shared: Vitals · Options: Book / Send advice only / Decline

---

## 🌐 The same day — a patient who never leaves home

**Teleconsult** is the online version of the same day.

The patient books a video slot from a public web page (`/book`) — no app, no account: pick a doctor, pick a 15-minute slot, enter name/age/mobile, verify with a code. The page shows both prices up front — *"₹500 in clinic · ₹400 video"*.

At the appointment time, the patient joins the video consult. The doctor does exactly the same seven-step consultation, signs, and:

- the prescription goes to the patient digitally,
- it is written to their ABHA record,
- and the money is collected.

So the online patient gets **the identical clinical safety** as a patient sitting in the clinic. That is the whole point of the design.

---

## 🌙 End of day

- **Dr. Rao** opens **Reports** and sees: consultations today, new vs returning patients, money collected, average wait ("check-in to called"), average consult length, and no-shows out of bookings. It also gives hints: *"Busiest time: Mondays around 11 am."*
- **Kiran (admin)** checks **Staff & roles → Activity log**, which reads like a diary written by the computer:

> *Dr. Ananya Rao looked at reports — 1:37 pm*
> *Mary Joseph signed in — 1:36 pm*
> *Dr. Meghana Iyer opened the record of Reyansh Sharma · W-01 — 1:35 pm*
> *Dr. Meghana Iyer started a prescription for Reyansh Sharma — 1:35 pm*

- Everyone signs out. On a shared tablet, anyone can press **Lock · switch user**, and the next person signs in with their own mobile + PIN.

---

# How the pieces talk to each other

Think of MedMate as a **kitchen with a head chef**. Each screen is a station. The **computer (the server)** is the head chef: it holds all the records, decides who is allowed to see what, and keeps the order of the day straight.

```
            PATIENT                                  STAFF
              │                                        │
   ┌──────────┴──────────┐                  ┌──────────┴──────────┐
   │                     │                  │                     │
 Kiosk              Public booking        Nurse Station      Doctor Console
 (walk-in)          (web page)            (vitals, route)    (consult, sign)
   │                     │                  │                     │
   └──────────┬──────────┴────────┬─────────┴──────────┬──────────┘
              │                   │                    │
              ▼                   ▼                    ▼
        ┌──────────────────────────────────────────────────┐
        │                THE MEDMATE CORE                 │
        │  Patient record · Queue · Visit · Prescription  │
        │  Invoice · Lab order · Appointment · Messages    │
        └──────────────────────────────────────────────────┘
              │                    │                   │
              ▼                    ▼                   ▼
        Reception Desk        Billing & POS        Lab Desk
        (print, check off)     (collect, close)     (samples, results)
              │                    │                   │
              └────────────────────┴───────────────────┘
                                   ▼
                          Doctor Inbox / Reports
                     (lab results, referrals, money)
```

**Three rules explain the whole system:**

1. **A patient is one row, wherever they go.** She checks in at the kiosk, gets token W-03. The nurse adds vitals to *that same row*. The doctor consults *that same row* and signs. The front desk prints and charges *that same row*. Nobody re-types the name or the mobile number. This is why the flow feels fast.

2. **A visit has a life, and it moves through states.** A visit is born *waiting*, becomes *vitals done* after the nurse, becomes *with doctor*, becomes *prescription ready* after signing, and finally *billed*. Each screen shows the patients in the state it is responsible for. The nurse screen shows "Need vitals"; the doctor screen shows "Up next"; the desk shows "Waiting at the desk".

3. **The server is the gatekeeper, not the screen.** Hiding a menu item is only cosmetic. MedMate's server checks every request against the signed-in person's role, and says no with a clear reason ("Your role cannot see reports", "Your role cannot do this", "This device is a patient kiosk"). That is why a front desk member who types a private web address still cannot get to the inbox.

**Special safety switches:**
- **The kiosk lock.** When a tablet is turned into a patient kiosk, the staff session is put to sleep — staff screens return *"This device is a patient kiosk"* and cannot be used. To get it back you need the PIN of the person who opened the kiosk.
- **The audit trail.** Every sign-in, record opened, prescription started, and payment taken is written down with the person's name and the time.
- **The digital signature.** Once signed, a prescription is locked and cannot be quietly changed.
- **ABHA consent.** Patient records are meant to be shared only with the patient's consent, through India's national health ID network.
- **Test mode.** Right now the app runs in demo mode: a banner at the top says *"Test mode for eSign, ABDM, payments: signatures and payments here are not real. Add the live keys before treating patients."*

---

# Who can see what

The app keeps its own table, and it is the same table that decides what the computer will actually allow:

| Area | Front desk | Nurse | Clinic admin | Doctor |
|---|:---:|:---:|:---:|:---:|
| Patient Kiosk | ✅ | — | ✅ | ✅ |
| Nurse Station | ✅ | ✅ | ✅ | ✅ |
| Doctor Console | ✅ | ✅ | ✅ | ✅ |
| Reception Desk | ✅ | — | ✅ | ✅ |
| Billing & POS | ✅ | — | ✅ | ✅ |
| Lab & Diagnostics | ✅ | ✅ | — | ✅ |
| Teleconsult | ✅ | — | ✅ | ✅ |
| Appointments | ✅ | — | ✅ | ✅ |
| Patients | ✅ | ✅ | ✅ | ✅ |
| Patient messages | ✅ | — | ✅ | ✅ |
| Settings | ✅ | ✅ | ✅ | ✅ |
| Reports | — | — | ✅ | ✅ |
| Doctors / Staff / Locations / Subscription | — | — | ✅ | — |
| Inbox | — | — | — | ✅ |
| My templates | — | — | — | ✅ |
| Diagnoses, notes and prescriptions | — | — | — | ✅ |

*The clinic owner (Dr. Rao) also gets everything in the Clinic admin column.*

> **Note for the team:** the *Doctor Console*, *Patients* and *Reception Desk* rows above are broader than the intended role policy, and the front desk / admin currently receive clinical fields (conditions, allergies) they should not see. The full audit report lists this as findings F1, F2, F4 and F5 with the fix. This table should be treated as the **target**, and the app's behaviour brought in line — or the app's table updated deliberately.

---

# Words you will hear

| Word | What it means in plain English |
|---|---|
| **Token** | The patient's queue number. Printed on a slip and shown on screen. "W-03" = a walk-in, the third one. |
| **Queue** | The ordered list of people waiting, split by doctor. |
| **Vitals** | The numbers a nurse measures: temperature, BP, pulse, oxygen, sugar, weight. |
| **Consult** / **Visit** | One patient's appointment, from arrival to billing. |
| **Prescription (Rx)** | The medicine instructions the doctor signs. |
| **e-Sign / DSC** | A legally valid digital signature (a "Class 2" signature), so a prescription is valid without a pen. |
| **ABHA** | India's national health ID number. Lets a patient's records be found across different hospitals — with the patient's consent. |
| **HPR ID** | A doctor's government registration ID, used to verify the doctor on ABDM. |
| **HFR ID** | The clinic's own health facility registration ID. |
| **FHIR** | The standard format used to share health records between different systems. |
| **UPI** | Indian instant payment (scan a QR, money moves). |
| **Day close** | End-of-day cash check: what the till should hold vs what it does hold. |
| **Queue / routing** | The nurse deciding which doctor should see the patient. |
| **Audit log** | The computer's diary of who did what and when. |
| **Kiosk mode** | A tablet locked into patient self-service, with staff access asleep. |

---

# Quick answers to everyday questions

**"Where is my patient?"**
Kiosk: they just checked in, they have a token. Nurse Station: they are waiting for vitals. Doctor Console: they are "up next" or "with doctor". Reception Desk: their prescription is ready to print. Billing: they still owe money.

**"I can't find a button."**
Every role has a *starting point* in the app called **Dashboard**, and cards saying what to open next. If you are the front desk, your tools are Reception Desk, Billing and Appointments. If you are the nurse, your tool is the Nurse Station. If you are a doctor, your tool is the Doctor Console.

**"I forgot my PIN."**
Ask the clinic owner or admin — they can see staff and PIN status on **Staff & roles**. (Note for the build: a "forgot PIN" path that does not require the OTP rate limiter would help.)

**"Can I use one login for the whole clinic?"**
No. Every person must sign in with their own mobile number and PIN. If two people share one login, the activity log cannot tell who did what — and MedMate says so on the Staff page.

**"The tablet is stuck showing the welcome screen."**
It is in **kiosk mode**. Press **Staff** and enter the 4-digit PIN of the person who turned it into a kiosk. (Worth adding: an emergency "someone else can take over" path.)

**"Can I print everything at once?"**
Yes — **Reports → Excel export** for consultation history and medicine analytics. (Worth adding: a full data copy of everything, since the Terms promise the clinic can take its records with it if it leaves.)

---

*This document explains the product as it behaves today, observed live on 17 November 2026. Companion document: `../../../packages/docs/platform/MEDMATE-PRODUCT-AUDIT.md` (the critical review, findings and roadmap).*
