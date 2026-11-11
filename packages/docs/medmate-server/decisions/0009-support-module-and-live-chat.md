# 0009. Support module and live chat

Status: accepted

## Context

Pharmacy owners need FAQs, support cases, and a persisted chat. Platform admin and support staff work those cases from the admin portal. The server is one Spring Boot process. Identity already owns accounts and Flyway versions V1–V4. Chat has to update an open screen without a second deployable.

## Decision

- `medmate-server-support` is a sibling module. It depends on shared and identity. The app module depends on it. Identity does not depend on it.
- Support tables live in the same Postgres database. Flyway keeps one history for the process. The support script is `V5__support.sql`. The next migration in either module is V6 or later.
- JDBC beans, the support service, and the socket beans load on the `local`, `prod`, and `identity-it` profiles, the same gate identity uses. The default profile does not open them, so the health test still starts without a database.
- Live updates use a raw WebSocket at `/support/stream` in this process, through `spring-boot-starter-websocket`. There is no STOMP endpoint and no second service.
- The HTTP filter permits the socket handshake. The first text frame must be `{"type":"auth","accessToken":"..."}` within 5 seconds. A missing token, a bad token, or an account that cannot open support closes the socket before any case data is sent. A valid frame is answered with `{"type":"ready"}`.
- The socket is push-only. Creating a case, claiming, sending a message, and resolving stay on HTTP. After commit the server sends `case.updated` or `message.created` only to connections that may read that case.

## Consequences

- Portal dev servers proxy `/support`, including the WebSocket upgrade.
- A later identity migration must not reuse V5.
- Server-core support code is not a source for this module.
