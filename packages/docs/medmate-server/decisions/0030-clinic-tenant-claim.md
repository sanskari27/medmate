# 0030. The clinic tenant claim

Status: accepted

## Context

`AccessTokens` issues an HS256 JWT whose only claim is the account id. The
clinic API is one service serving many clinics, and each clinic has its own
database on the shared Postgres instance, so every request has to resolve
which clinic it belongs to before it can touch data.

The token is already the thing the clinic API trusts, so it is the natural
place to carry the tenant. The alternative was for the clinic API to call back
into `medmate-server` to resolve an account id to a clinic on every request,
which puts a network hop and a failure mode in front of every read.

The account id alone is not enough, because the same account id can be looked
up in more than one table, and a lookup per request is what the token is for.

## Decision

- A clinic access token carries `clinicId` and `clinicRole`.
- Every other account type carries no tenant claim, so its token is unchanged.
- The clinic API validates the bearer with the same HS256 secret and reads the
  claim. It does not call `medmate-server` to resolve the tenant.
- The secret is shared between the two services through one SSM Parameter,
  `/medmate-repo/common/jwt_secret`, read by both. It is not copied into a
  second parameter, so the two services cannot drift.
- A token with no `clinicId` claim is not a clinic session, and the clinic API
  answers it 401 with detail `Session was not accepted`.
- The claim is issued by `medmate-server` and cannot be set by a client.

## Consequences

- `AccessTokens.issue` gains the tenant. It keeps its existing signature for
  every other account type.
- The two services now share a secret, so a leak of it affects both. It is
  rotated in one place. It lives in Secrets Manager and is
  delivered to the containers as an environment value.
- The clinic API can serve a request without a network hop to `medmate-server`.
  It still depends on `medmate-server` for sign-in, and it trusts the token
  signature rather than the account's current state, so a clinic account that
  is disabled keeps its access token until it expires. Disabling a clinic
  account takes effect on the next sign-in, or when the token is refreshed.
