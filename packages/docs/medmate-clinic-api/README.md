# Clinic API

Hostname: clinic-api.nammamedmate.com

What it does: Serves one clinic's data to the doctor portal. It verifies the
clinic session that medmate-server issued, resolves which clinic the caller
belongs to from the token, and serves that clinic's patients from that
clinic's own database, redacting the clinical fields and the amounts the
caller's grants do not allow.

Where its records are stored: The shared Postgres instance. The registry
database holds one row per clinic, mapping `clinic_id` to `database_name` and
`display_name`. Each clinic's own database holds that clinic's patients,
grants, visits, prescriptions and invoices. The registry holds no
credentials, and no clinic's rows are visible from another clinic's database.

Where its files are stored: `packages/apps/medmate-clinic-api` in this
repository, as its own Maven reactor.

How it is deployed: A container. `packages/infra/medmate-clinic-api` calls the
shared `modules/app-service` module, which builds the image from the app's
Dockerfile, pushes it to ECR and runs it on the shared EC2 host behind Caddy.
The service listens on :8091 and reports health at `/actuator/health`.

Locally: `make db-clinic-local` creates the demo clinic's database, then
`make clinic-api` runs the service on http://127.0.0.1:8091. The service owns
the registry schema: it creates `clinic_registry` and registers the demo clinic
when it starts. The clinic's own database holds its patients and its grants,
and `make db-clinic-local` seeds those.
