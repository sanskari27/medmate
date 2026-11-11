# Admin token refresh

## Context

Signed-in requests send `Authorization: Bearer <accessToken>`. The access token lasts 15 minutes. `POST /auth/refresh` with `{ refreshToken }` rotates the refresh token and returns a new session. The admin client stores that session in Redux, and the app subscription copies it to `sessionStorage`. A 401 today fails the call and leaves the expired access token in place.

## Scope

- One refresh and one retry inside the admin API client.
- Every signed-in RTK Query call that uses that client.

## Non-goals

- The dispensary portal, the pharmacy app, and medmate-server.
- Refreshing on a timer before the access token expires.
- Treating `403` or a failed login as an expired session.

## Behavior

A `401` from a signed-in request calls `POST /auth/refresh` once. That call does not send the expired bearer. The server rejects an expired bearer before `/auth/refresh` runs.

When refresh returns a session, the client stores it with `auth/sessionStarted` and keeps the current `pinReset`. It then sends the original request once more with the new access token. The retry does not refresh again. A second `401` is returned as-is.

When refresh fails, or there is no refresh token, the client clears the session once with `auth/sessionCleared`. The original `401` is returned and the request is not retried. A missing session already returns the user to login.

Overlapping `401`s share one refresh. Refresh revokes the presented refresh token, so a second refresh with that same token would fail.

These paths do not refresh and do not clear the session: `/auth/otp/send`, `/auth/otp/verify`, `/auth/pin`, `/auth/sign-out`, `/auth/refresh`, and `/auth/admin-bootstrap`. A wrong OTP, a wrong PIN, and sign-out stay as they are. `/auth/pin/set` still refreshes, because it needs a bearer token.

Any other status, including `403`, is returned unchanged.

## Acceptance criteria

- A signed-in `401` refreshes once without a bearer, stores the rotated session, and retries the original request once with the new access token.
- Overlapping `401`s perform one refresh.
- A failed refresh clears the session, does not retry, and does not call refresh again for that attempt.
- A `401` on the retry does not start another refresh.
- A `401` from OTP verify, PIN login, or sign-out does not refresh or clear the session.

## Tests

`src/app/apiClient.test.ts`:

- First call `401`, refresh `200`, retry `200`: one refresh without `Authorization`, the retry sends the new bearer, and the store holds the rotated refresh token.
- Two overlapping `401`s share one refresh.
- Refresh `401`: refresh is called once, the original call is not retried, and the session is cleared.
- Retry still `401`: refresh runs once, and there is no third call.
- `POST /auth/otp/verify` `401` does not call refresh and does not clear a session.
