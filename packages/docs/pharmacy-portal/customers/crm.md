# CRM

Route `/crm`. Header “CRM · Patients”. The screen builds patient rows from sales and stores notes, reminders, loyalty redemptions, campaigns, and feedback on those rows.

Opening it requires `crm:read`. The screen is behind the paywall on Essential and on a lapsed paid plan.

This is the CRM that exists in the portal today. It is not a full patient CRM. The missing capabilities are listed at the end and are not specified yet.

Patients are sales that are not cancelled, not named Walk-in, and not named Kiosk (self-order). Points are one per ₹100 spent. Tiers are New at 0, Silver at 12, Gold at 50, and Platinum at 120. Segments are fixed: Chronic care, High value, Lapsed / at-risk, New, On credit, and Regular. Chronic categories are diabetes and heart. A refill is due 30 days after the last purchase in those categories.

The lists come from `GET /api/v1/session`. This screen does not call its own list endpoint. Write calls do not declare a response type. Money amounts are rupees on the screen and paise on the wire.

## What the user sees

Tabs: Overview, Patients & Segments, Reminders, Loyalty, Campaigns, Feedback, Analytics.

Overview shows patients, active in 30 days, at-risk, refills due in 7 days, loyalty points, and average rating. It lists refills due this week and at-risk patients with no purchase in 60 days or more. Empty copy: “No refills due in 7 days.” and “No at-risk patients — great retention!”

Patients has search “Search patient…” and the six segments. Columns are Patient, Segments, Tier, Points, RFM, Orders, Last visit, and Lifetime. Empty: “No patients in this segment.”

Reminders lists refills due in 14 days. Columns are Patient, Medicine, Due, Phone, and Send reminder. Empty: “No refills due in the next 14 days.” Recent reminders show the latest eight.

Loyalty shows points outstanding, an approximate liability, and the tier counts. The table is the top 50 patients. There is no empty sentence. The footnote says patients earn 1 point per ₹100, and that a referral gives both people ₹100 credit. That credit is not applied on this screen.

Campaigns has a segment, WhatsApp or SMS, an optional offer, and a message. History lists saved campaigns. Empty: “No campaigns yet.” The note says bulk send is not connected. The screen opens the first recipient for the user to send.

Feedback picks a patient, a rating from 1 to 5, an NPS from 0 to 10, and a comment. Empty: “No feedback yet.”

Analytics shows average lifetime value, repeat rate, churn risk, campaign sales, and the top 10 patients by RFM. The table has no empty sentence.

## Patient

The patient dialog shows name, tier, phone, email, segments, and refill state. It shows lifetime spend, orders, average order, units, points, RFM, first visit, and days since the last sale. It lists medicines, purchase history, loyalty progress, and engagement.

Clinical fields: age, gender, date of birth, blood group, conditions, allergies, address, a care note, and consent for WhatsApp and SMS. Save is allowed with blanks. Empty strings are dropped. Conditions and allergies are split on commas.

## Actions

| Action | Key | What happens |
| --- | --- | --- |
| Open the screen and the patient | `crm:read` | Local. No write. |
| Save profile | `crm:update` | Confirm “Update this patient?” |
| Send refill, follow-up, or win-back | `crm:remind` | Opens WhatsApp or SMS and logs the reminder. No confirm. |
| Request feedback | `crm:request_feedback` | Opens WhatsApp. It does not save feedback. |
| Create campaign | `crm:create_campaign` | Confirm “Create this campaign?” Disabled when nobody has a phone in the segment. |
| Save feedback | `crm:create_feedback` | Confirm “Save this feedback?” Disabled until a patient is chosen. |
| Redeem 50 points, or fewer if that is all they have | `crm:redeem` | Confirm “Redeem these points?” Disabled at 0 points. |
| New sale | `pos:read` | Opens Billing / POS. |
| Call | `crm:read` | Opens the phone link. |

Adherence and birthday message text exists in the code and has no button.

## Alerts

Success toasts: “Campaign saved”, “Feedback saved”, “Redeemed {points} pts · ₹{points} off”. Profile save and reminder log have no toast.

Failures: “Could not save the patient”, “Could not save the campaign”, “Could not save the feedback”, “Could not log the reminder”, “Could not redeem points”, “Sign in required”.

## States

No loading or error panel. Empty copy is listed above. Loyalty and analytics tables have none.

## API

`PATCH /api/v1/crm/patients/{key}` saves the profile. The body may include conditions, allergies, consent, note, age, gender, blood group, address, and date of birth. The session is not reloaded. The screen merges the saved fields.

`POST /api/v1/crm/campaigns` saves name, segment, channel, message, optional offer label, and reach. The name is “{segment} blast” or “All blast”. Success reloads the session.

`POST /api/v1/crm/feedback` saves the patient key, name, rating, optional NPS, and optional comment. NPS is kept between 0 and 10. Success reloads the session.

`POST /api/v1/crm/reminders` saves the patient key, name, kind (`refill`, `followup`, or `winback`), and channel (`whatsapp` or `sms`). Success reloads the session.

`POST /api/v1/crm/redemptions` saves the patient key, name, and points. Zero points does not call the API. Success reloads the session.

WhatsApp, SMS, and phone links do not call the CRM API.

The session field `crm` holds meta, campaigns, feedbacks, reminders, and redemptions. Each stored row also has an id and a time. Those response fields are not declared on the write calls.

## Not specified

The current screen does not include the capabilities below. They are not given fields, APIs, or keys until they are approved:

1. A patient record with no earlier sale, and a way to merge duplicates.
2. Linking people in one household.
3. Segments the pharmacy defines, beyond the six fixed segments.
4. Reminders that send on a schedule, including refill, birthday, and lapsed patients, without opening a chat by hand.
5. A bulk campaign with sent, failed, and opt-out.
6. Replies stored on the patient.
7. Tasks and follow-up dates assigned to a staff member.
8. Appointments.
9. A block on WhatsApp and SMS when consent is off. Consent is stored today. A send block was not found.
10. Complaint cases inside CRM.
11. Leads who have not purchased.
12. Applying the ₹100 referral credit named in the loyalty footnote.

## Current app

`crm` is one module key named `crm`. The paywall opens for any active paid plan. The screen does not read its loading or error flags.

## Related documents

- [Permissions](../access/permissions.md)
- [Customers](customers.md)
- [Khata](khata.md)
- [Portal shell](../shell/portal-shell.md)
