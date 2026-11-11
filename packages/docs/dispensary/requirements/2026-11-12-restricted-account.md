# Restricted pharmacy account

## Context

A pharmacy owner uses dispensary. After Platform admin blocks that owner, the owner must not reach the dashboard, setup, PIN setup, or the application-status screen. The owner still signs in. Pharmacy staff of that owner are refused at sign-in.

The application-status screen already sits outside the dashboard shell and can sign out. This screen is the blocked owner's equivalent.

## Scope

- A waiting screen at `/account-restricted` for a pharmacy owner whose account is `disabled`.
- Routing that sends that owner there ahead of `/pin`, `/setup`, `/application-status`, and `/dashboard`.
- Showing the server's refusal when pharmacy staff of a blocked owner try to sign in.

## Non-goals

- The admin portal, the pharmacy app, and medmate-server. The API is specified separately.
- A new request from this screen. It does not read the application or call a block route.
- Restricting a staff member onto this screen. Staff do not receive a session.

## Behavior

The screen uses the same full-page shell as application status, including Log out.

The heading is "Your account is restricted." The sentence under it is "Contact us to get it unblocked." The button is named "Contact us" and its href is `mailto:support@nammamedmate.com`.

`homePath` checks `account.disabled` for a pharmacy owner before PIN setup and before verification status. A disabled owner always resolves to `/account-restricted`. A missing `disabled` value is treated as false so an older stored session still routes as it does today.

An owner who is already signed in moves to this screen when the next refresh stores `disabled: true`. The screen does not call another pharmacy route.

Pharmacy staff sign-in already shows the problem detail from verify or PIN login. When the server returns "This pharmacy is restricted.", that sentence is the login error. No session is stored.

## Acceptance criteria

- A disabled owner on an approved, incomplete, pending, or rejected account sees only this screen and can sign out.
- The Contact us control addresses `support@nammamedmate.com`.
- A disabled owner does not land on `/pin` or `/dashboard`.
- Staff sign-in that returns "This pharmacy is restricted." stays on the login screen and shows that sentence.

## Tests

- `AccountRestricted.test.tsx` in the setup feature: heading, sentence, mailto, and log out.
- `homePath.test.ts`: a disabled owner resolves to `/account-restricted` for each verification status and for PIN setup required.
- `AppRouter.test.tsx`: a disabled owner session renders the restricted screen; a staff verify that returns the restricted detail stays on login and shows that sentence.
