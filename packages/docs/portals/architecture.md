# Portal architecture

Dispensary (`dispensary.nammamedmate.com`) and admin (`admin.nammamedmate.com`) are separate Vite apps. Dispensary is the pharmacy console. Admin is the platform-staff shell. Neither portal imports the other.

## Stack

TypeScript, Vite, React 19, Tailwind v4, npm, Vitest, Testing Library, ESLint, and Prettier. Routing is React Router. Shared client state is Redux Toolkit. HTTP is RTK Query. Forms are React Hook Form. Validation is Zod.

SCSS modules, pnpm, Storybook, Playwright, and Husky are not part of these apps. Styling is Tailwind on the component. The palette in each app's `src/styles/globals.css` is the pharmacy theme.

Dependencies beyond the shared stack:

- `react-hook-form`, `@hookform/resolvers`, and `zod` validate the phone, OTP, and PIN fields.
- `eslint-plugin-boundaries` stops a feature from importing another feature, and stops shared UI from importing features.

Axios and dayjs are not installed. Nothing in this slice needs them. RTK Query uses `fetch`.

## Where code goes

Both apps use the same `src/` map: `app`, `components`, `features`, `hooks`, `services`, `lib`, `utils`, `constants`, `types`, `styles`, and `tests`. `@/*` maps to `src/*`.

A component lives in its own folder: `Component.tsx`, `Component.types.ts`, `Component.test.tsx` when it has behavior worth testing, and `index.ts`. Do not add an empty file for a component this slice does not render.

Dependency direction:

- `app` may import features, shared UI, and infrastructure.
- A feature may import shared UI, infrastructure, and its own files. It imports another feature only through that feature's `index.ts`.
- Shared UI may import other shared UI and utilities. It does not import features or `app`.
- Presentational components do not call `fetch`. The auth feature service performs send, verify, PIN, sign-out, and the dev SMS-mock read.

`@typescript-eslint/no-explicit-any` is enabled.

## Login

Identity routes are the ones in `bruno/medmate/identity/auth`. They live on the API root (`/auth/otp/send`, `/auth/otp/verify`, `/auth/pin`, `/auth/pin/set`, `/auth/sign-out`), not under `/api/v1`. Dispensary sends `accountType: "pharmacy"`. Admin sends `accountType: "platform"`. The server resolves that to the one admin or staff account for the phone.

Dispensary login and signup send `accountType: "pharmacy"` only. On login, a tab selector chooses pharmacy owner or staff. Signup is for an owner and does not show that selector. After verify or PIN login, the account in the response is kept in the auth state when `account.pharmacyRole` matches that choice. Business name and retail/hospital cards are not auth fields, so dispensary does not show them. Staff cannot sign themselves up. A disabled pharmacy owner still signs in and is routed to `/account-restricted` before PIN setup, setup, application status, and the dashboard. Pharmacy staff of a blocked owner do not get a session. Verify and PIN login show "This pharmacy is restricted." Admin intro has one Get started button and then a mobile number. It does not ask for a name or a role. The sidebar role comes from the returned account: "Platform admin", or the staff subtypes in the order Compliance, Finance, Sales, Support. The sidebar name is `displayName`, or that role when the name is blank. Reviews is shown for a platform admin and for staff whose subtypes include compliance. Finance, sales, and support who open Reviews go to the dashboard. Support is shown for a platform admin and for staff whose subtypes include support. Other staff who open Support go to the dashboard. On dispensary, Help & Support is a Management item for a pharmacy owner. Pharmacy staff do not see it, and `/support` sends them to the dashboard.

In dev, after a send that returns `mode: "otp"`, the app reads the latest code the way the Bruno Send OTP script does: normalize the phone, `GET /sms-mock/messages`, and walk the list from the end. Vite proxies `/sms-mock` to `http://127.0.0.1:8090` because the SMS mock does not send CORS headers. The code is shown in the existing dashed Demo OTP box. Production builds do not call the mock and do not render that box. `make sms-mock` has to be running locally.

## Copied screens

When a later requirement copies a pharmacy screen, keep the same element order and placement. Do not import the pharmacy package. Do not edit pharmacy to make a portal compile.

Help & Support on dispensary copies the pharmacy contact row, FAQ accordion, and ticket list. The contact row is Live chat and Email. A case opens in a right-side chat panel at `/support/:caseId`, with the list still on screen. Admin Support edits the shared FAQ list and opens a case transcript at `/support/cases/:caseId`. Both screens call medmate-server and listen on `/support/stream`. Profile on dispensary copies pharmacy Business Settings for an approved owner, without the Online store toggle, Distributors, or Store setup wizard. Licence, pharmacist, and signature changes return the pharmacy to compliance review.
