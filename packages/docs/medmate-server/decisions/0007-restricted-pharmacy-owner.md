# 0007. Restricted pharmacy owner sessions

Status: accepted

## Context

Blocking a pharmacy owner sets that account `disabled`. A disabled account cannot sign in, refresh, or call the API. The owner still has to reach a restricted screen, which means they need a session. Pharmacy staff of that owner must not.

## Decision

- A disabled pharmacy owner may verify, sign in with an existing PIN, and refresh. The account JSON includes `disabled: true`.
- That session's bearer is accepted only on `POST /auth/refresh` and `POST /auth/sign-out`. Every other bearer is rejected.
- PIN reset and `POST /auth/pin/set` stay refused.
- Pharmacy staff whose owner is disabled do not receive a session. Verify, PIN login, and refresh are rejected. Sign-out still revokes a refresh token they already hold.
- Other disabled accounts stay rejected at send, verify, PIN, and refresh.

## Consequences

- Dispensary can store the refreshed account and show only the restricted screen.
- A blocked owner's access token cannot keep using the pharmacy API until it expires.
- Platform staff and customers are unchanged.
