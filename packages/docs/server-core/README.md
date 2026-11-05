# server-core

`https://api.nammamedmate.com` is a Java 21 Spring Boot API. It runs in Docker on the shared EC2 instance, with a 768 MB limit, and listens on port 8080.

It serves the pharmacy console API under `/api/v1` and `POST /api/v1/consultations`. Leads are not implemented yet.

Endpoints include session, pharmacy profile, inventory, purchasing, sales, prescriptions, offers, credit, customers, CRM, expenses, employees, users, subscription, bank, advisors, reports, hospital, support, referrals, files, auth, and master administration.

Rows are stored in the shared Postgres database `server_core`. Files are stored at `s3://medmate-repo/app-uploads/server-core/` when a bucket is configured, and in the `files` table otherwise. The container has no data volume.

Infrastructure for the repository, DNS record, and database is `packages/infra/server-core`.
