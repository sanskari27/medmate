# Pharmacy CRM

## Context

An approved pharmacy posts a cash bill and can return units from it. Staff need one patient directory for those bills, credit (khata) on a named customer, and the CRM writes that sit on that person: profile, reminders, loyalty, campaigns, and feedback. The dispensary screen is [CRM - Patients](../../dispensary/requirements/2026-11-13-crm-patients.md). The module boundary is [0018](../decisions/0018-pharmacy-crm.md).

## Scope

- `payMode` `credit` on `POST /pharmacy/bills`, beside `cash`. Stock still drops. UPI, card, COD, and insurance stay unavailable.
- A patient is derived from bills. The key is the 10-digit phone. There is no create-patient route.
- `GET /pharmacy/patients`, `GET /pharmacy/patients/{phone}`, `GET /pharmacy/patients/export`, and `PATCH /pharmacy/patients/{phone}`.
- `POST /pharmacy/patients/{phone}/repayments`, `/reminders`, `/redemptions`, and `/feedback`.
- `GET` and `POST /pharmacy/crm/campaigns`, `GET /pharmacy/crm/reminders`, `GET /pharmacy/crm/feedback`, and `GET /pharmacy/crm/analytics`.
- Permission keys `patients:read` and `patients:update` on the closed pharmacy catalog. Posting a credit bill stays `billing:create`.

## Non-goals

- UPI, card, COD, or insurance as a bill pay mode. UPI and card are repayment modes only.
- A stored medicine category, a chronic segment, and an automatic refill date.
- Sending WhatsApp or SMS. The server stores the log or campaign.
- Editing a bill, deleting a patient, and a person who has never been billed.
- A return changing loyalty points. A return does reduce khata.
- Reading `server_core`, `app-uploads/server-core/`, or `/medmate-repo/server-core/*`.

## Behavior

Every patients and CRM route uses `Access.pharmacy` for the caller's pharmacy. An approved owner is allowed. A staff member needs the key named below. Anyone else receives 403.

`patients:read` lists and opens a patient and reads campaigns, reminders, feedback, and analytics. The detail is `Patients cannot be read`. It does not export or write.

`patients:update` saves a profile, repayment, reminder, redemption, campaign, and feedback, and calls export. The detail is `Patients cannot be updated`. `patients:read` does not write.

`billing:create` posts a credit bill. The detail for a missing charge permission stays `Bills cannot be created`.

A bill name of `Walk-in` or `Kiosk (self-order)`, after trim, cannot be posted on credit. The detail is `Credit needs a customer name`. Those two names are left out of the directory even on a cash bill. Every other billed phone is a patient. The displayed name is the name on that phone's earliest included bill, by `soldAt`, then invoice number.

`GET /pharmacy/patients` uses the shared page parser. A bad page is `Page is not valid`. `q` is a case-insensitive substring of the name or phone. A blank `q` does not filter. `sort` is `spent` (the default), `orders`, or `recent`. Any other `sort` is 400 `Sort is not valid`. `segment` is `all` (the default), `high-value`, `lapsed`, `new`, `credit`, or `regular`. Any other `segment` is 400 `Filter is not valid`. Spent sorts by lifetime spend descending, then phone. Orders sorts by order count descending, then phone. Recent sorts by last bill descending, then phone. A patient matches a segment when that segment is one of theirs.

The response is `patients`, `summary`, `aging`, `page`, `size`, and `total`. A row is `phone`, `name`, `orders`, `spent`, `units`, `lastAt`, `rx`, `points`, `tier`, `segments`, `creditOutstanding`, and `daysSince`. Money fields are decimal strings with two places. `rx` is true when any included bill stored a prescriber. `points` is the whole-rupee spend divided by 100, rounding down. A return does not change spend or points. Tiers are New, Silver at 12 points, Gold at 50, and Platinum at 120. `daysSince` is whole UTC days from `lastAt` to the request time, using a 86400000 millisecond day, and may be negative. Segments, in this order, are high-value when the monetary RFM score is at least 4, lapsed when `daysSince` is over 60 and orders are at least 2, credit when the phone has a credit bill or a repayment, and new when there is one order and `daysSince` is at most 30. A phone with none of those is `regular`. Chronic is never added. RFM recency is 5, 4, 3, 2, then 1 at 15, 30, 60, and 90 days. Frequency is 5, 4, 3, 2, then 1 at 8, 5, 3, and 2 orders. Monetary is 5, 4, 3, 2, then 1 at 60, 35, 18, and 8 percent of the highest spend in the pharmacy, and that highest spend is at least 1.

`summary` and `aging` ignore `page`, `size`, `q`, `sort`, and `segment`. `summary` is `named`, `lifetimeSales`, `repeat`, `chronic`, `creditOutstanding`, `active30`, `atRisk`, `refillsDue`, `loyaltyPoints`, and `avgRating`. `chronic` and `refillsDue` are 0. `repeat` counts phones with more than one bill. `active30` counts `daysSince` of at most 30. `atRisk` counts the lapsed rule. `loyaltyPoints` is earned points minus redemptions, never below zero, summed across phones. `avgRating` is the mean of stored ratings, half-up to two places, or null when there is no feedback.

Outstanding is the sum of credit-bill payables for that phone, minus return refunds on those bills, minus repayments, and never below zero. Aging applies that same net per bill, then clears the oldest remaining bill before the next. Overdue means the oldest remaining credit bill is more than 30 days old. `aging` is three buckets, `cur` (0–30 days), `d60` (31–60), and `d60p` (61+), each with `label`, `amount`, and `count`. A phone with nothing left is in no bucket.

`GET /pharmacy/patients/{phone}` returns `patient`. An unknown phone, including another pharmacy's, is 404 `Patient was not found`. The document adds `firstAt`, `profile`, `purchases`, `ledger`, `given`, `repaid`, `outstanding`, `availablePoints`, `reminders`, `feedback`, and `redemptions`. A purchase is `number`, `soldAt`, `payable`, `payMode`, and `units`, newest first. A ledger line is `at`, `kind` (`debit`, `return`, or `repayment`), `label`, `amount`, and `ref`, newest first. A credit bill is a debit labelled `Credit bill`. A return on a credit bill is `return` labelled `Return`. A repayment is `repayment`. Its label is `Repayment · Cash`, `Repayment · UPI`, or `Repayment · Card`, and a stored note is appended after another ` · `. A blank note adds nothing. `given` is the credit billed. `repaid` is repayments only.

`profile` is `age`, `gender`, `bloodGroup`, `dob`, `address`, `conditions`, `allergies`, `note`, and `consent`. Missing profile fields are null, and `consent` is false.

`PATCH /pharmacy/patients/{phone}` returns the patient document. A missing field is left as stored. A JSON null clears a text or age field. `gender` is empty, Male, Female, or Other. `age` is a whole number from 0 through 120. Anything else is 400 `Profile is not valid`.

`POST /pharmacy/patients/{phone}/repayments` returns 201 with `repayment`: `code`, `phone`, `amount`, `mode`, `note`, and `at`. The body is `amount`, `mode` (`cash`, `upi`, or `card`), and an optional `note`. A non-positive amount, more than two decimal places, or an unknown mode is 400 `Repayment is not valid` and stores nothing. An amount above the outstanding balance is 400 `Repayment is more than the balance` and stores nothing. The code is `CR-001`, then `CR-002`, for that pharmacy. It is not reused.

`POST /pharmacy/patients/{phone}/reminders` returns 201 with `reminder`: `id`, `phone`, `kind`, `channel`, and `at`. `kind` is `refill`, `adherence`, `followup`, or `winback`. `channel` is `whatsapp` or `sms`. Anything else is 400 `Reminder is not valid`.

`POST /pharmacy/patients/{phone}/redemptions` returns 201 with `redemption`: `id`, `phone`, `points`, and `at`. Points saved are the available points, at most 50. Available points of zero is 400 `No points to redeem` and stores nothing. The body is ignored.

`POST /pharmacy/patients/{phone}/feedback` returns 201 with `feedback`: `id`, `phone`, `rating`, `nps`, `comment`, and `at`. `rating` is a whole number from 1 through 5. `nps` may be omitted or a whole number from 0 through 10. A blank comment is stored as null. Anything else is 400 `Feedback is not valid`.

`POST /pharmacy/crm/campaigns` returns 201 with `campaign` and `first`. The body is `segment`, `channel`, `message`, and an optional `offerLabel`. `segment` uses the list filter values, including `all` and `chronic`. A blank message, or a bad segment or channel, is 400 `Campaign is not valid`. The stored name is the segment label plus ` blast`, or `All blast` for `all`. Labels are Chronic care, High value, Lapsed / at-risk, New, On credit, and Regular. `reach` is how many patients are in that segment. `first` is the first of those patients in the default spent order, `{ phone, name }`, or null when the reach is zero. `GET /pharmacy/crm/campaigns` returns `campaigns`, newest `sentAt` first. `GET /pharmacy/crm/reminders` returns `reminders`, newest first. `GET /pharmacy/crm/feedback` returns `feedback`, newest first.

`GET /pharmacy/crm/analytics` returns `averageLifetimeValue`, `retentionPercent`, `churnRisk`, `campaignSales`, `rfmLeaders`, and `leaders`. The average is lifetime spend divided by the patient count, half-up to two places, or `0.00` when there are none. Retention is the percentage of patients with more than one order, rounded half-up, or 0. `campaignSales` sums bill payables at or after each campaign's `sentAt` for patients who are in that campaign's segment now. `leaders` are the ten highest RFM scores, then phone. `rfmLeaders` is that list's length.

| Status | Detail |
| --- | --- |
| 400 | `Page is not valid` |
| 400 | `Sort is not valid` |
| 400 | `Filter is not valid` |
| 400 | `Credit needs a customer name` |
| 400 | `Payment type is not available` |
| 400 | `Profile is not valid` |
| 400 | `Repayment is not valid` |
| 400 | `Repayment is more than the balance` |
| 400 | `Reminder is not valid` |
| 400 | `No points to redeem` |
| 400 | `Feedback is not valid` |
| 400 | `Campaign is not valid` |
| 403 | `Patients cannot be read` |
| 403 | `Patients cannot be updated` |
| 403 | `Bills cannot be created` |
| 404 | `Patient was not found` |

## Acceptance criteria

- A staff member with `patients:read` can list and open a patient and cannot export, repay, or save a profile. A staff member with `patients:update` can. A staff member with only `billing:create` can post a credit bill and cannot open the directory.
- A credit bill for Ada on `9886012345` appears in the directory. A return of part of that bill lowers `creditOutstanding` by the refund. A repayment above the remainder stores nothing. The next accepted repayment is `CR-001`.
- A bill named `Walk-in` is rejected on credit and is absent from the directory when posted as cash. UPI is still `Payment type is not available`. A credit bill decrements the sold batch. Another pharmacy receives 404.

## Tests

- `PatientRulesTest` for the phone key, excluded names, points, tiers, segments other than chronic, outstanding after a return, and a repayment above the balance.
- `PatientControllerTest` for the read and update gates.
- `PatientIT` for a credit bill creating a patient, a return lowering the balance, a capped repayment, profile save, export forbidden to a reader, and pharmacy isolation.
- `BillRulesTest` for credit accepted and UPI still rejected. `BillIT` for a credit bill decrementing the batch.
- Bruno requests `patients/list-patients.bru`, `patients/read-patient.bru`, `patients/update-patient.bru`, `patients/repay.bru`, `patients/remind.bru`, `patients/redeem.bru`, `patients/campaign.bru`, `patients/feedback.bru`, and `bills/post-credit-bill.bru`.
