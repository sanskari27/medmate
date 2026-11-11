# Application status waiting screen

## Context

`/application-status` is the dispensary screen for a pharmacy owner in `pending_compliance` or `pending_admin`. Today it shows one heading and one status label. The review order is already fixed: a submission is complete, compliance reviews it, then admin reviews it. This screen only explains that wait. It replaces the waiting-screen paragraph in [Dispensary setup wizard](2026-11-11-setup-wizard.md).

## Scope

- A multi-line waiting screen on `/application-status`.
- A progress indicator for the two review stages, taken from the signed-in account status.

## Non-goals

- A new API, or reading the submitted application on this screen.
- The form, document list, rejection comment, or an edit action.
- Estimated review times.
- The admin portal, the pharmacy app, and `/setup`.

## Behavior

The screen stays outside the dashboard shell and still signs out through the existing auth action. The heading stays "Your application is under review".

Under the heading, one sentence names the current stage:

| Status | Sentence |
| --- | --- |
| `pending_compliance` | Compliance is reviewing this application. |
| `pending_admin` | Admin is doing the final review. |

A progress bar follows that sentence. It counts completed stages only. Submitted is already complete on this screen, so the scale is 0 to 3.

| Status | Completed | Bar |
| --- | --- | --- |
| `pending_compliance` | 1 — submitted | one third |
| `pending_admin` | 2 — submitted and compliance | two thirds |

The bar exposes `role="progressbar"` with `aria-valuemin` 0, `aria-valuemax` 3, and `aria-valuenow` equal to the completed count. Its accessible name is "Application review".

Three lines follow, in this order. Each line has a title, a state word, and one sentence.

1. Submitted. State is Done. Sentence: "We have your application."
2. Compliance review. State is In review while status is `pending_compliance`, and Done while status is `pending_admin`. The Done sentence is "Compliance approved this application." The In review sentence is the compliance sentence above.
3. Admin review. State is Waiting while status is `pending_compliance`, and In review while status is `pending_admin`. The Waiting sentence is "Admin review starts after compliance." The In review sentence is the admin sentence above.

The screen does not offer an edit.

## Acceptance criteria

- `pending_compliance` shows the compliance sentence, a progress value of 1, Compliance review as In review, and Admin review as Waiting.
- `pending_admin` shows the admin sentence, a progress value of 2, Compliance review as Done, and Admin review as In review.
- Submitted is Done on both statuses.
- The owner can still sign out, and still cannot open the dashboard from either pending status.

## Tests

- `ApplicationStatus.test.tsx` in the setup feature: both statuses, the progress value, and the three line states.
- `AppRouter.test.tsx`: the waiting-screen assertion matches the compliance sentence instead of "Pending compliance".
