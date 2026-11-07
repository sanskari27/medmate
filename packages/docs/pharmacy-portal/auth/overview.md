# Authentication overview

This document names the user types and the shared rules for one-time codes. Sign-in steps for each type are in the linked documents.

## User types

| User type | Roles | Sign-in |
| --- | --- | --- |
| Admin | master, sales, support, finance, compliance | Phone number and password. See [Admin login](admin-login.md). |
| Pharmacy | owner, pharmacist, inventory-manager, ward-attendant / staff, accountant | Phone number and a 4-digit PIN after the PIN is saved. Before that, the owner uses a phone number and SMS OTP. A staff member chooses email or phone for the first OTP. See [Pharmacy signup](pharmacy-signup.md) and [Pharmacy staff login](pharmacy-staff-login.md). |
| Customer | One role | OTP login and signup. That flow is documented later. |
| Rider | Expected later | Documented later. |

A pharmacy has one owner. The owner is the only pharmacy user who can sign up. See [Pharmacy signup](pharmacy-signup.md).

## Roles and permissions

Pharmacy roles are owner, pharmacist, inventory-manager, ward-attendant, and accountant. Permission tables use the name ward-attendant for that role.

Keys are fixed and use the form `screen_name:action`. Each key is true or false. The lists are in [Permissions](../access/permissions.md).

A new owner starts with every key true. An admin user with the master role can set the owner’s keys true or false. The owner cannot change their own keys. The owner sets the four staff roles. A staff user can act only when the key is true on the owner and true on that user’s role. There is no separate permission list on each staff user.

An admin user with the master role can do everything.

## One-time codes

Every OTP is 6 digits.

The person chooses email or phone as the destination each time:

- an admin resets a password
- a pharmacy user resets a PIN
- a pharmacy staff member signs in for the first time

These owner steps always send the OTP by SMS to the phone number on the account:

- owner signup
- owner sign-in while no PIN is saved, which covers a waiting application, a rejected application, and the first sign-in after approval

The account is identified by phone number when a pharmacy user requests an OTP.

A demo run uses the fixed code `000000`. Any other run creates a random 6-digit code on the server and sends it by SMS or email. The screen does not show the code and does not offer autofill. This covers owner and staff sign-in, PIN reset, and the hospital pricing unlock. See [Hospital billing](../hospital/hospital-billing.md).

## Message delivery

Email OTPs are sent with Resend. The Resend API key is a secure string in Parameter Store at `/medmate-repo/server-core/resend_api_key`.

SMS OTPs are sent with DLT. Promotional SMS messages are also sent with DLT.

## Related documents

- [Admin login](admin-login.md)
- [Pharmacy signup](pharmacy-signup.md)
- [Pharmacy staff login](pharmacy-staff-login.md)
- [Plans](plans.md)
- [Permissions](../access/permissions.md)
