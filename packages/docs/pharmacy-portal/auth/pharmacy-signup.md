# Pharmacy signup

Only a pharmacy owner can sign up. A pharmacy has one owner. One phone number can be used for one pharmacy application.

Staff accounts are created by the owner after approval. See [Pharmacy staff login](pharmacy-staff-login.md).

## First screen

The owner enters:

- Pharmacy name
- Phone number

The app sends a 6-digit OTP by SMS to that phone number.

## Leaving before submit

If the owner verifies the phone and leaves before submit, the verified phone number is kept. The wizard answers are dropped, including the pharmacy name.

On the next visit they sign in with that phone number and an SMS OTP. The wizard starts empty.

The application is stored only when the owner submits.

## Setup wizard

The wizard opens after the signup OTP succeeds. It shows the pharmacy name from the first screen. The owner can edit that name before submit.

### Business details

| Field | Rule |
| --- | --- |
| Pharmacy name | Required. The wizard shows the name from the first screen, and the owner can edit it. |
| Business type | Required. Select at least one. None are selected by default. |
| Registration type | Defaults to Proprietorship. |
| Industry | Defaults to Pharmacy & Healthcare. |
| Phone | Shown and disabled. The number is already verified. |
| Email | Required. |

Business type is a multi-select:

- Retail Pharmacy
- Wholesale / Distribution
- Hospital Pharmacy
- Online Pharmacy
- Ayurvedic / Generic
- Surgicals & Equipment

Registration type:

- Proprietorship
- Partnership
- Private Limited Company
- LLP
- HUF
- Public Limited Company
- Not Registered

Industry:

- Pharmacy & Healthcare
- Retail
- Wholesale
- Hospital / Clinic
- Diagnostics

### Address

| Field | Required |
| --- | --- |
| Address line 1 | Yes |
| Address line 2 | No |
| City | Yes |
| State | Yes |
| PIN code | Yes |

### Licences

Each number is required, and each document is required.

| Licence | What is collected |
| --- | --- |
| GSTIN | Number and document |
| PAN | Number and document |
| Drug Licence No. (D.L.) | Number and document |
| FSSAI Licence No. | Number and document |
| Trade Licence No. | Number and document |

### Tax and invoice

| Field | Rule |
| --- | --- |
| Enable TDS | Switch. Defaults to off. |
| Deduct TDS on applicable purchases | Switch. Defaults to off. This switch is independent of Enable TDS. |
| Invoice number prefix | Required. |
| Signature / stamp | Required file. |
| Terms and conditions | Optional. Shown on invoices. |

### Pharmacy features

The owner may turn these on or off during setup:

| Feature | Meaning |
| --- | --- |
| Accept online orders | The pharmacy accepts online orders. |
| List your store on the Namma MedMate customer app | The store is listed on the Namma MedMate customer app. |
| Self-order kiosk | In-store screen for customers to order themselves. |
| e-Invoicing | Generate IRN/e-invoices for B2B sales. |
| Loose / per-tablet selling | Allow selling individual tablets by default for per-strip eligible items. |

Low-stock and expiry alerts are always on. The dashboard flags items to reorder and items that are expiring.

## After submit

The application goes to admin compliance. Until it is approved, the owner can sign in with the phone number and an SMS OTP and open only a waiting panel.

The panel shows:

- application status
- comments
- the MedMate support phone

The same support phone is shown to every pharmacy.

After either rejection, the comments are the comments written by the reviewer who rejected the application. The application stays closed. The owner can read those comments and call the support phone.

### Statuses

| Status | Meaning |
| --- | --- |
| Pending compliance review | Waiting for a compliance user to review the paperwork. |
| Rejected by compliance | A compliance user rejected the application with comments. |
| Pending master review | Compliance approved. Waiting for a master user. |
| Rejected by master | A master user rejected the application with comments. |
| Approved | A master user approved the application. |

Any admin user with the compliance role may perform the first review. They check the paperwork, then approve or reject with comments.

The master review starts only after compliance has approved. Any admin user with the master role may approve or reject with comments. The pharmacy owner is the applicant and does not review the application.

## First sign-in after approval

The owner signs in with the phone number and an SMS OTP.

The portal opens only after the owner saves a 4-digit PIN.

Later sign-ins use the phone number and that PIN.

To reset the PIN, the owner chooses email or phone each time. The app sends a 6-digit OTP, and the owner sets a new PIN.

Approval places the pharmacy on the Essential plan, stored as Free. See [Plans](plans.md).
