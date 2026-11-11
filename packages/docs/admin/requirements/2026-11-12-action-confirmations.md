# Action confirmations

## Context

Platform admin blocks and unblocks a pharmacy owner from the owner detail, and staff subtypes file a block request that admin approves or rejects. Review detail records an application decision as soon as Approve or Reject application is clicked. Those actions restrict an account or record a review, so each one asks first.

This replaces the Block account and Unblock account buttons in [2026-11-12-pharmacy-owners.md](2026-11-12-pharmacy-owners.md). Request, approve block, and reject request stay the same actions and gain a confirmation. Review reject still collects the comment before the confirmation, as in [2026-11-12-reviews.md](2026-11-12-reviews.md).

## Scope

- A confirmation dialog in admin shared UI, copied from the pharmacy confirm dialog without importing `packages/apps/pharmacy`.
- A switch in admin shared UI, copied from the pharmacy switch.
- The owner detail block control for platform admin when the owner is clear or blocked.
- Confirmations for request block, approve block, reject request, block, unblock, review approve, and review reject.

## Non-goals

- Changing medmate-server, dispensary, or the pharmacy app.
- A confirmation on Reviews list navigation, document preview, or sign-out.
- A reason field on a direct block or unblock.

## Behavior

The dialog is a modal named by its title. A tone bar and mark sit above the title and one sentence. Cancel is on the left. The confirm button is on the right. Danger uses the rose button, caution uses gold, and positive uses the primary button. Cancel, Escape, and the overlay dismiss the dialog and do not call the API. While the request runs, Cancel, Escape, the overlay, and the confirm button do nothing. A failure stays in the dialog and shows the problem detail. A success closes the dialog and keeps the current page behavior: the owner detail is replaced by the response, and a review decision returns to `/reviews`.

| Action | Title | Sentence | Confirm | Tone |
| --- | --- | --- | --- | --- |
| Request block | Request a block? | Admin still has to approve this request. | Request block | caution |
| Approve block | Approve this block? | The owner is restricted and pharmacy staff cannot sign in. | Approve block | danger |
| Reject request | Reject this request? | The owner stays active. | Reject request | caution |
| Block | Block this account? | The owner is restricted and pharmacy staff cannot sign in. | Block account | danger |
| Unblock | Unblock this account? | The owner and pharmacy staff can sign in again. | Unblock account | positive |
| Review approve | Approve this application? | This records the decision for this stage. | Approve | positive |
| Review reject | Reject this application? | The owner can update the application and submit it again. | Reject application | danger |

Platform admin sees one switch on a clear or blocked owner. The visible label is Active when the switch is off and Blocked when it is on. The accessible name is "Block account" when off and "Unblock account" when on. Clicking it does not flip the switch. It opens the matching dialog. The switch flips only after the response says the owner is blocked or clear. A requested owner has no switch. Admin still sees the reason, Approve block, and Reject request, each with its dialog.

A staff subtype on a clear owner still needs a reason. Request block stays disabled while the reason is blank. With a reason, it opens the dialog, and confirm sends the trimmed reason. Cancel leaves the reason in the field.

Review Reject still opens the comment field. A blank comment shows "A comment is required." and does not open the dialog. A comment longer than 2000 characters still does not submit. With a valid comment, Reject application opens the dialog. Cancel keeps the comment and does not post. Approve opens its dialog immediately. Cancel stays on the detail.

## Acceptance criteria

- Block and unblock are one switch. The switch position matches the owner after a successful confirm, and it does not change when the dialog is cancelled.
- Request block, approve block, reject request, review approve, and review reject do not call the API until the dialog is confirmed.
- A review reject without a comment still does not submit.
- A failed confirm leaves the previous detail in place and shows the problem detail in the dialog.

## Tests

- `ConfirmDialog.spec.tsx`: title, sentence, confirm, cancel, and overlay dismiss.
- `Switch.spec.tsx`: checked state and accessible name.
- `PharmacyDetailPage.test.tsx`: a staff request posts only after confirm; cancel does not post; an admin approve, the block switch, and unblock each post only after confirm.
- `ReviewDetailPage.test.tsx`: Approve posts only after confirm; Reject application posts only after the comment and the confirm; cancel does not post.
