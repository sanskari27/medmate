# Admin sign-in

## Context

The admin portal copied the pharmacy onboarding screen. It asked for a business type, an optional business name, and a role: Platform admin, Compliance, Finance, Sales, or Support. The client then sent `accountType: "admin"` or `accountType: "staff"` and kept the chosen label as the sidebar role. Platform admin and staff accounts are created ahead of time. The person signing in should not pick a role or a name.

## Scope

- The admin login screen in `packages/apps/admin`.
- The signed-in name and role on the admin sidebar.
- Auth requests from that portal, which send `accountType: "platform"`.

## Non-goals

- The dispensary portal, the pharmacy app, and pharmacy owner or pharmacy staff login.
- Moving the name to the top of the sidebar. The top stays **Namma MedMate** / Partner Console.
- Asking for a name at login, or editing `displayName` in the portal.
- PIN login for platform accounts.

## Behavior

The intro has one button, **Get started**. It opens the mobile form. There is no "I already have an account · Log in" link, no retail or hospital cards, no business name field, and no role selector.

Intro slides:

- "Review pharmacy applications" — "Compliance and final approval stay in one queue."
- "Pharmacies and their owners" — "See each pharmacy, its owner, and whether that account can sign in."
- "A number for each teammate" — "Platform admin, compliance, finance, sales, and support each sign in with their own mobile number."

The left panel says "Admin console", then "Review pharmacies from one screen.", then "Applications, pharmacy owners, and platform staff — one console for the Namma MedMate team." The trust rows are "Application review" and "Owner access".

The phone step heading is "Sign in". The subtitle is "Enter the mobile number on your platform account." Send and verify use `accountType: "platform"` and `purpose: "login"`. The session is the account the server returns. The client does not store a portal choice. A leftover `portalChoice` in an already saved session is ignored.

The sidebar name line is `displayName` when it is non-blank. When `displayName` is blank, the name line is the role and the role line is hidden. The word "Pharmacist" is not used.

The role is "Platform admin" for an admin account. For staff, present subtypes are joined in this order: Compliance, Finance, Sales, Support. Staff with no subtype show "Staff".

Reviews stays available for a platform admin and for staff whose subtypes include compliance.

## Acceptance criteria

- Get started is the only intro action, and it opens a mobile form with no name field and no role selector.
- Send and verify send `accountType: "platform"`.
- A stored name is shown at the bottom of the sidebar. A blank name shows the role, not "Pharmacist".
- Finance and compliance together show "Compliance, Finance".
- The top of the sidebar still says Namma MedMate.

## Tests

- `src/app/routes/AppRouter.test.tsx`
- `src/features/authentication/utils/portalAccount.test.ts`
- `src/features/authentication/store/auth.slice.test.ts`
