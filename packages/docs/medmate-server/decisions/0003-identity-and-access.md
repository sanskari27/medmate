# 0003. Identity module and access checks

Status: accepted

## Context

Pharmacy tenants, platform staff, and customers need accounts, sessions, and permission checks. Those rules will be called by later CRM modules. The runnable process is still one Spring Boot app. Shared request-id and ProblemDetail types lived in the app module, which a sibling module cannot depend on.

## Decision

- `medmate-server-shared` holds request ids, `ApiProblem`, and the ProblemDetail handler.
- `medmate-server-identity` holds accounts, sessions, pharmacy verification, and access checks. The app depends on it. Later feature modules may depend on it for access checks. Identity does not depend on a feature module.
- JDBC and Flyway persist the module. There is no JPA.
- Spring Security is the stateless JWT filter and the route rules. Domain rules stay plain types that unit tests construct without Spring.
- An access token lasts 15 minutes and carries the account id. Role, grants, and verification status are loaded from Postgres on each request. Refresh tokens last 30 days, are stored hashed, and rotate.
- The local SMS mock is a JDK process in this module. It is not a deployed service.

## Consequences

- Feature modules that need an access check depend on identity. That dependency is part of the domain.
- Sign-out revokes the refresh token. The access token stays valid until it expires.
- Default-profile tests that only boot health do not start the identity beans.
