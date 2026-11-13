# Decisions

Architecture decisions for medmate-server.

| ADR | Title |
| --- | --- |
| [0001](0001-replace-server-core.md) | Replace server-core with a health-only medmate-server |
| [0002](0002-local-java-and-postgres.md) | Run locally on Java 21 and Postgres 16; deploy with Docker |
| [0003](0003-identity-and-access.md) | Identity module, JWT sessions, and access checks |
| [0004](0004-production-postgres-and-flyway.md) | Enable production Postgres and Flyway |
| [0005](0005-pharmacy-document-storage.md) | Private pharmacy documents under app-uploads/medmate-server |
| [0006](0006-presigned-pharmacy-document-links.md) | Presigned S3 links on the pharmacy application detail |
| [0007](0007-restricted-pharmacy-owner.md) | A disabled pharmacy owner may hold a limited session |
| [0008](0008-platform-phone-sign-in.md) | Platform login resolves one admin or staff phone |
| [0009](0009-support-module-and-live-chat.md) | Support module, shared Flyway history, and live chat socket |
| [0010](0010-pharmacy-staff-pin-and-permissions.md) | Pharmacy staff PIN login and the closed permission catalog |
| [0011](0011-employee-register.md) | Employee register, shared document store, and V7 |
| [0012](0012-distributor-directory.md) | Distributor directory, payable ledger, and V9 |
| [0013](0013-stock-and-purchases.md) | Stock module, purchase bills, and V10 |
| [0014](0014-pharmacy-offers.md) | Pharmacy offers, inventory name port, V11, and V12 |
| [0015](0015-pharmacy-racks.md) | Pharmacy rack placement on the stock product, and V13 |
| [0016](0016-pharmacy-billing.md) | Pharmacy billing, sale counter, V14, and V15 |
| [0017](0017-pharmacy-sale-returns.md) | Sale list and returns stay in billing, V17 |
| [0018](0018-pharmacy-crm.md) | CRM module, credit bills, and V19 |
| [0019](0019-pharmacy-expenses.md) | Expense register, V20 |
| [0020](0020-pharmacy-reports.md) | Pharmacy reports read from posted rows |
| [0021](0021-pharmacy-dashboard.md) | Pharmacy dashboard read from posted rows |

The next file is the next number: `0022-<slug>.md`.

Write an ADR when the change picks a structure that later work has to live with: a new module boundary, a datastore, authentication, or a different deployable. A requirement spec records product behavior. It does not replace an ADR.
