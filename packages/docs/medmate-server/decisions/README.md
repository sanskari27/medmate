# Decisions

Architecture decisions for medmate-server.

| ADR | Title |
| --- | --- |
| [0001](0001-replace-server-core.md) | Replace server-core with a health-only medmate-server |
| [0002](0002-local-java-and-postgres.md) | Run locally on Java 21 and Postgres 16; deploy with Docker |
| [0003](0003-identity-and-access.md) | Identity module, JWT sessions, and access checks |
| [0004](0004-production-postgres-and-flyway.md) | Enable production Postgres and Flyway |
| [0005](0005-pharmacy-document-storage.md) | Private pharmacy documents under app-uploads/medmate-server |

The next file is the next number: `0006-<slug>.md`.

Write an ADR when the change picks a structure that later work has to live with: a new module boundary, a datastore, authentication, or a different deployable. A requirement spec records product behavior. It does not replace an ADR.
