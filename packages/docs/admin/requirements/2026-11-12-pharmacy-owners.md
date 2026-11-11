# Admin pharmacy owners

## Context

The admin portal signs in Platform admin and Compliance only. Reviews is the only directory, and it lists applications in `pending_compliance` or `pending_admin`. Pharmacy owners are `accountType: "pharmacy"` rows on `pharmacy`. Pharmacy staff are memberships, not those rows. Platform staff subtypes are `finance`, `support`, `sales`, and `compliance`.

This requirement adds a directory of every pharmacy owner, a detail page, and block or unblock. A subtype files a block request. Platform admin approves or rejects it, and can also block or unblock immediately.

## Scope

- Sign-in choices for Platform admin, Compliance, Finance, Sales, and Support.
- A Pharmacies section for every account that can stay signed in.
- A list of pharmacy owners and a detail page.
- Request, approve, reject, direct block, and direct unblock from that detail page.

## Non-goals

- medmate-server, the dispensary portal, and the pharmacy app. Those are specified separately where they change.
- Changing who can decide a review. Reviews stays available to Platform admin and to staff whose subtypes include `compliance`.
- Search, filters, pagination, or a request history.
- Blocking a pharmacy staff account as its own row. Staff are not listed.
- A new visual system. The list follows the Reviews rows. The detail follows the Reviews field order and document preview. The pharmacies feature does not import the reviews feature.

## Behavior

### Sign-in

On the login phone step, the Account radiogroup lists Platform admin, Compliance, Finance, Sales, and Support. Platform admin stays the default. The control is hidden on the OTP and PIN steps. Changing the number returns to the phone step with the last choice kept.

Platform admin sends `accountType: "admin"`. Each other choice sends `accountType: "staff"`. Send, verify, and PIN login all use that choice.

A successful verify or PIN login is stored only when the account matches the choice. Otherwise the new refresh token is revoked, the session is not stored, and the phone step shows one message:

| Choice | Account | Message |
| --- | --- | --- |
| Platform admin | `admin` | stored |
| Platform admin | `staff` with exactly one of the four subtypes | This number is a {subtype} account. Choose {Label} to sign in. |
| Platform admin | anything else | This number is not a platform admin. |
| A subtype | `admin` | This number is a platform admin. Choose Platform admin to sign in. |
| A subtype | `staff` whose subtypes include that choice | stored |
| A subtype | other `staff` | This account is not a {subtype} account. |
| A subtype | anything else | This number is not a {subtype} account. |

`{subtype}` is the lowercase wire value. `{Label}` is Compliance, Finance, Sales, or Support.

A stored session stays signed in when it is an admin, or staff whose subtypes include at least one of `finance`, `support`, `sales`, and `compliance`. Any other stored session is cleared and the login screen is shown. Its refresh token is revoked when one is still present.

The sidebar role is the label of the choice used to sign in. That choice is kept in the admin auth state across refresh. It is not a second permission set. Reviews stays visible when the account is an admin or its subtypes include `compliance`, even if the person chose Finance, Sales, or Support.

### List

Pharmacies is a sidebar item labelled "Pharmacies". Its route is `/pharmacies`. Home, then Reviews when this account can review, then Pharmacies.

The page loads `GET /pharmacy-owners`. The server orders rows. Each row shows the pharmacy name, phone, verification status, and block state. A blank name is an em dash, and that row's accessible name is the phone. Otherwise the accessible name is the pharmacy name. Status labels are Incomplete, Rejected, Compliance review, Final review, and Approved. Block states are Active, Block requested, and Blocked.

Activating a row opens `/pharmacies/{pharmacyId}`.

While the request is in flight, the page does not show the empty state. An empty list says "No pharmacy owners yet." A failure shows that problem detail and no rows.

A finance, sales, or support session that opens `/reviews` or `/reviews/{pharmacyId}` is sent to `/dashboard`. Those paths stay available to Platform admin and compliance.

### Detail

`/pharmacies/{pharmacyId}` stays inside the shell. The shell header stays Pharmacies, and Pharmacies stays selected. The page heading is the pharmacy name, or an em dash when the name is blank, with a link back to `/pharmacies` named "All pharmacies".

The page reads `GET /pharmacy-owners/{id}` and shows the same groups, in the same order, as the review detail: summary, pharmacy, registration, licences, billing, then documents. Empty text is an em dash. Booleans are Yes or No. Document preview follows the review rules: the first document is selected, an image is an `img`, a PDF is an `iframe`, a path URL is loaded with the session bearer, and an absolute `https` URL is not requested with a bearer.

The block area follows the documents.

| Account | Block state | What is shown |
| --- | --- | --- |
| Staff subtype | clear | A required Reason field and Request block |
| Staff subtype | requested | The reason and "Waiting for admin review." |
| Staff subtype | blocked | Blocked. No unblock control |
| Platform admin | clear | A switch labelled Active. Turning it on asks before blocking. No reason field |
| Platform admin | requested | The reason, Approve block, and Reject request. Each asks before it runs |
| Platform admin | blocked | A switch labelled Blocked. Turning it off asks before unblocking. No reason field |

Request block, approve block, and reject request each ask before they run. The switch and the dialog copy are in [2026-11-12-action-confirmations.md](2026-11-12-action-confirmations.md). Request block sends `POST /pharmacy-owners/{id}/block-requests` with the trimmed reason. Approve and Reject send `POST /pharmacy-owners/{id}/block-requests/{requestId}/decision` with `approve` or `reject`. Turning the switch on sends `POST /pharmacy-owners/{id}/block`. Turning it off sends `POST /pharmacy-owners/{id}/unblock`.

A success replaces the detail with the response. A failure shows that problem detail and leaves the previous detail in place.

## Acceptance criteria

- Finance, Sales, and Support can sign in from their own choice and see Home and Pharmacies, not Reviews.
- Platform admin and Compliance still see Reviews, and also see Pharmacies.
- A staff account with both finance and compliance can sign in through Finance and still see Reviews.
- The list does not have a control that would show a pharmacy staff account.
- Request block is refused in the UI without a reason. Platform admin does not see Request block.
- Approve, reject, direct block, and direct unblock call the routes above and show the returned block state.

## Tests

- `portalAccount.test.ts`: each choice, the mismatch sentences, who may stay signed in, and the stored role label.
- `AppRouter.test.tsx`: a finance verify shows Pharmacies and hides Reviews; a compliance verify still shows Reviews; opening `/reviews` as finance returns to Home.
- `PharmaciesPage.test.tsx`: row contents, blank name, empty list, and a problem detail.
- `PharmacyDetailPage.test.tsx`: a staff request, an admin approve, a direct block, and a direct unblock.
