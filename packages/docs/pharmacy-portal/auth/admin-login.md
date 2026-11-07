# Admin login

Admin users sign in with a phone number and a password.

Roles and shared OTP rules are in [Overview](overview.md).

## Roles

| Role | How the user is created |
| --- | --- |
| master | Created directly in the database by a database administrator. The app cannot create this user. More than one master is allowed. |
| sales | Created in the app by an admin master. |
| support | Created in the app by an admin master. |
| finance | Created in the app by an admin master. |
| compliance | Created in the app by an admin master. |

An admin master can do everything. Predefined permissions for sales, support, finance, and compliance are documented with the later modules.

## Creating an admin user

An admin master enters:

- Name
- Email
- Phone
- Role: sales, support, finance, or compliance
- Password

Email and phone are both required.

The master shares that password with the person outside the app.

## Password reset

Each admin user, including a master, resets their own password in the app.

Each time they reset, they choose email or phone. The app sends a 6-digit OTP to that channel. Email uses Resend. SMS uses DLT. See [Overview](overview.md).

## Work tied to these roles

Pharmacy applications are reviewed in two steps. See [Pharmacy signup](pharmacy-signup.md).

1. Any user with the compliance role may review the paperwork and approve or reject the application with comments.
2. After compliance approves, any user with the master role may approve or reject the application with comments.

The master step starts only after compliance has approved. The compliance step belongs to the compliance role.

Plan upgrade requests go to an admin user with the support role. See [Plans](plans.md).
