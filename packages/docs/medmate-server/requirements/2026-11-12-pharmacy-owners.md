# Pharmacy owner directory and block

## Context

Pharmacy owners are one `pharmacy` row each. Pharmacy staff are `pharmacy_membership` rows and must not appear in an owner directory. Platform staff subtypes are `finance`, `support`, `sales`, and `compliance`. A disabled account cannot sign in today: OTP send is skipped, verify and PIN fail, refresh fails, and `JwtFilter` rejects the bearer.

Admin needs every owner, of any verification status, plus a way to block the owner account. A staff subtype files one open request with a reason. Platform admin approves or rejects it, and can also block or unblock with no request. Approval and a direct block set the owner account `disabled`. The owner must still be able to sign in and refresh so dispensary can show a restricted screen. Pharmacy staff of that owner must not get a session.

## Scope

- `GET /pharmacy-owners` and `GET /pharmacy-owners/{id}`.
- Block request, decision, direct block, and direct unblock.
- Sign-in, refresh, and bearer rules for a disabled pharmacy owner, and refusal for that pharmacy's staff.
- The next identity Flyway migration for the request table.
- An ADR for the restricted-owner session exception.

## Non-goals

- A new Maven module, datastore, or host. The table is the next Flyway migration in identity, under [0004](../decisions/0004-production-postgres-and-flyway.md).
- Review decisions, pharmacy staff management, and the pharmacy application submit flow.
- Request history in the API. Decided rows stay stored and are not returned.
- Blocking pharmacy staff by setting their own `disabled` flag. Their sign-in is refused because the owner is disabled.
- Pulling routes, tables, or auth from server-core.
- The admin and dispensary apps.

## Behavior

### Directory

The caller must be a non-disabled admin, or non-disabled platform staff with at least one subtype. A pharmacy owner, pharmacy staff member, customer, rider, or disabled account receives 403.

`GET /pharmacy-owners` returns every pharmacy. It does not return pharmacy staff or platform staff. Order is pharmacy name ascending, case-insensitive, with a blank name last, then pharmacy id ascending.

Each item is `pharmacyId`, `name`, `phone`, `status`, and `blockState`. `phone` is the owner account phone. `status` is the verification status. `blockState` is `blocked` when the owner account is disabled, otherwise `requested` when an open block request exists, otherwise `clear`.

`GET /pharmacy-owners/{id}` uses the same caller rule. An unknown id is 404. The body is the application detail already returned by `GET /pharmacy-applications/{id}`, plus `blockState` and `request`. `request` is null or `{ id, reason, requestedAt }` for the open request. Documents stay presigned links under [0006](../decisions/0006-presigned-pharmacy-document-links.md).

`GET /pharmacies/{id}/documents/{slot}` allows the same platform callers as this directory, and still allows the pharmacy owner of that pharmacy. A disabled account still cannot read a document. A finance staff member can read a stored file. A pharmacy staff member still cannot.

### Requests and decisions

`POST /pharmacy-owners/{id}/block-requests` with `{ reason }` is allowed for non-disabled platform staff. Platform admin receives 403 with detail "Platform admin decides a block directly." A blank reason is 400 with detail "A reason is required." An unknown pharmacy is 404. A disabled owner, or an open request for that pharmacy, is 409. The response is the owner detail, with `blockState` `requested`.

`POST /pharmacy-owners/{id}/block-requests/{requestId}/decision` with `{ decision }` is allowed for a non-disabled admin. `decision` is `approve` or `reject`. Anyone else receives 403. An unknown pharmacy or request is 404. A request that is not open is 409. Approve sets the owner account disabled and marks the request approved. Reject marks the request rejected and leaves the owner enabled. The response is the owner detail.

`POST /pharmacy-owners/{id}/block` is allowed for a non-disabled admin and has no body. It sets the owner disabled. An owner who is already disabled, or a pharmacy with an open request, is 409. The open request is decided with Approve, not with this route. The response is the owner detail.

`POST /pharmacy-owners/{id}/unblock` is allowed for a non-disabled admin and has no body. It clears the owner disabled flag. An owner who is not disabled is 409. The response is the owner detail. It does not delete decided requests.

One pharmacy has at most one open request.

### Restricted sign-in

The account JSON gains `disabled`. It is false except for a disabled account that is still allowed to receive a session.

A disabled pharmacy owner can receive a login OTP, verify it, and sign in with a PIN when a PIN is already set. The session account has `disabled: true`. PIN reset and `POST /auth/pin/set` stay refused. Signup is unchanged.

`POST /auth/refresh` succeeds for that owner and returns `disabled: true`. `POST /auth/sign-out` still revokes the refresh token. `JwtFilter` accepts a disabled pharmacy owner's bearer on those two routes only. Every other bearer from that owner is 401 with detail "Session was not accepted", so the portal refreshes and then routes from the new account.

A disabled platform staff account, customer, or rider is still rejected at send, verify, PIN, and refresh.

Pharmacy staff whose owner is disabled do not receive a session. Verify and PIN login return 401 with detail "This pharmacy is restricted." Refresh returns the same detail and does not issue a token. An existing staff bearer is 401 with that detail on every route except `POST /auth/sign-out`, which still revokes the refresh token. OTP send for that staff phone still follows the existing send rules; the refusal is at verify, PIN, and refresh.

## Acceptance criteria

- A finance caller can list owners and does not see a pharmacy staff account.
- A pharmacy owner and a customer receive 403 on the list.
- Sales can file one request with a reason. A second open request is 409. Admin approval disables the owner. Admin rejection leaves the owner enabled.
- Admin direct block disables the owner when no request is open, and is 409 when a request is open. Unblock clears the flag.
- A disabled owner can verify and refresh, and a later pharmacy read with that bearer is 401 until refresh has replaced the session.
- Staff of that owner receive 401 "This pharmacy is restricted." on verify, PIN login, and refresh.
- A finance caller can read a stored pharmacy document. The disabled owner cannot.

## Tests

- `BlockRulesTest`: caller rules, block state, one open request, and the restricted-owner session exception. Plain JUnit, no Spring.
- `IdentityFlowIT`: the acceptance criteria above, including a pharmacy staff row that is absent from the list.
- Bruno, under `bruno/medmate/identity/owners/`: `list-owners.bru`, `read-owner.bru`, `request-block.bru`, `decide-block.bru`, `block-owner.bru`, `unblock-owner.bru`.
- ADR [0007](../decisions/0007-restricted-pharmacy-owner.md): a disabled pharmacy owner may hold a session limited to refresh and sign-out; pharmacy staff of that owner may not.
