# Portal shell

The shell is the signed-in frame around every screen: sidebar, header, paywall, fault banner, toasts, and sign-out.

Menu and Notifications are route labels only. `/menu` and `/notifications` render the dashboard. The header Menu button opens the sidebar. The bell opens Prescriptions when `prescriptions:read` is allowed.

## Who can see a nav item

A nav item is shown when all of these are true:

- the user can act on that screen’s `read` key, as in [Permissions](../access/permissions.md)
- the plan includes the screen, or the screen is always open
- a hospital item is shown only when the pharmacy business type is hospital

Search in the header opens Inventory when `inventory:read` is allowed. New sale opens Billing / POS when `pos:read` is allowed. The upgrade chip opens Subscription. It is shown on the Essential plan.

## Always open

These screens are open on every plan: dashboard, account, subscription, settings, support, referrals.

These screens stay open on Essential: Billing / POS, inventory, purchases, invoice settings, manage users.

Every other signed-in screen is behind the paywall on Essential, and on a paid plan that has lapsed. A lapsed plan has status expired, or a renewal date before today. An open grant for that route, with no end date or an end date of today or later, removes the paywall for that route.

The paywall says the screen is a premium feature, names the current plan, and says Billing / POS, Inventory, and Purchases stay open. The buttons are Upgrade to unlock and See all plans. Both open Subscription.

## What the frame shows

The brand is Namma MedMate, Partner Console. The store chip shows the pharmacy name and either “Online · accepting orders” or “Online store paused”.

Nav groups:

| Group | Items |
| --- | --- |
| — | Dashboard, Billing / POS, Orders, Sales, Prescriptions, Customers, Credit · Khata, CRM · Patients |
| Hospital | IPD · Wards, Hospital Billing, Active Patients, Sales Register, Ward Indents, Departments, Doctors |
| Catalogue | Inventory, Rack & Locations, Purchases, Reorder · Distributor, Distributors, Online Store, Offers, Self-Order Kiosk |
| Business | Reports, Expenses, CA / Accountant |
| Account | Account, Employees, Manage Users, Invoice Settings, Subscription, Refer & Earn, Settings, Help & Support |

Badges count new online orders, pending prescriptions, and pending ward indents.

The footer shows the registered pharmacist name and “© 2026 Medmate India Technology Private Limited”.

## Sign-out

Log out, Sign out, and Exit open the same dialog. The title is Log out. The body is “You will leave this session. Sign in again to continue.” Cancel closes it. Log out calls `POST /api/v1/auth/sign-out` with no body. If that call fails, the portal still signs out locally and returns to the dashboard route.

Support viewing a pharmacy shows a banner “Support · {pharmacy name} · {impersonator}” and Exit. That banner is shown only when the session has an impersonator.

## Alerts

A toast shows the message and clears after 1.8 seconds.

A fault banner shows the failed action’s message and Dismiss error. Cancelling a confirm does not call the API. The code `UNAUTHORIZED` does not open the banner.

Before the session is loaded, the frame shows “Loading pharmacy…”.

## Session

`GET /api/v1/session` loads the pharmacy when the signed-in frame opens, and again when the browser tab becomes visible. The response is the session snapshot: profile, subscription, grants, users, employees, bank account, tickets, referrals, suppliers, sales, inventory, and the other lists the screens read. Screens that only display those lists do not call a separate list endpoint.

A 401 rejects as unauthorized and does not open the fault banner. Any other failure shows the server message, or “Could not load the pharmacy”, or “Could not reach the server. Check your connection.”

Money in JSON is sent as integer paise and read back as rupees.

## Current app

The shell checks the old module keys, and routes with no key are visible to every signed-in user. The owner bypasses that check. Hospital items already require business type hospital. The paywall already blocks Essential and lapsed paid plans. The target visibility is the `read` key plus the plan plus the hospital check.

## Related documents

- [Permissions](../access/permissions.md)
- [Plans](../auth/plans.md)
- [Dashboard](../home/dashboard.md)
