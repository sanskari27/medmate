# Help and support

## Context

Platform admin and support staff handle the FAQ list and the support cases created by pharmacy owners. Admin can read a transcript. Only a staff account whose subtypes include `support` can pick up a chat, reply, and mark it resolved. The API is [Help and support API](../../medmate-server/requirements/2026-11-12-help-and-support.md).

## Scope

- A Support nav item for platform admin and for staff whose subtypes include `support`.
- `/support` for FAQs and the case list.
- `/support/cases/:caseId` for the transcript.
- Live updates on the list and the open transcript.

## Non-goals

- Changing who can open Reviews or Pharmacies.
- The dispensary portal, the pharmacy app, and medmate-server behavior beyond calling it.
- Deleting an FAQ, attachments, and pagination.

## Behavior

`canSupport` is true for `accountType` `admin`, and for staff whose subtypes include `support`. Other staff who open `/support` or `/support/cases/:caseId` go to `/dashboard`. The nav label is Support.

`/support` stacks two sections. FAQs come first. Each row shows the question, a published switch, edit, move up, and move down. Add FAQ asks for a question and an answer. Edit uses the same fields. The switch hides a FAQ by setting `published` false. Move up and move down send the full id order. There is no delete.

Cases follow. A row shows the ticket id, pharmacy name, subject, category, status, and the assignee name or Unassigned. The row opens `/support/cases/:caseId`.

The transcript lists messages with the author name. Platform admin does not see a composer, Pick up, or Mark resolved. Support staff see the composer and Mark resolved while the case is not resolved. Pick up is shown only while the status is `waiting`. The socket refreshes the list and the open transcript.

## Acceptance criteria

- Admin and support see Support in the nav. Finance opening `/support` lands on Home.
- Admin can add a FAQ and cannot pick up, reply, or resolve.
- Support can pick up a waiting case, send a message, and mark it resolved.
- A claimed row shows the assignee. A waiting row shows Unassigned.

## Tests

- `portalAccount.test.ts` for `canSupport`.
- `SupportPage.test.tsx` for adding a FAQ and for admin versus support actions on the list.
- `SupportCasePage.test.tsx` for the admin transcript and the support Pick up, composer, and Mark resolved controls.
- `AppRouter.test.tsx` for the finance redirect.
