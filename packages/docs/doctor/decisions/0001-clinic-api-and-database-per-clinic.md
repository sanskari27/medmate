# 0001. A separate clinic API, and one database per clinic

Status: accepted

## Context

`medmate-server` is a pharmacy CRM. It holds catalog, stock, invoices,
prescribers and distributors for pharmacies. Clinic records - patients,
visits, prescriptions, invoices for a doctor's practice - are a different
domain and none of those tables apply to them.

A clinic is a tenant that has to be isolated from every other clinic. On the
shared Postgres instance there are two ways to do that: a `clinic_id` column on
every table of one database, or a database per clinic.

The doctor portal also needs to exist as an application in this repository,
next to the dispensary and the admin portal, so it is built on the stack those
portals use.

## Decision

- The doctor portal is `packages/apps/doctor`, a Vite React 19 application on
  Tailwind v4, RTK Query, React Hook Form and Zod. It uses the same folder
  map, the same `project.yaml` contract and the same Terraform module as the
  other portals.
- The clinic API is a separate service, `packages/apps/medmate-clinic-api`, on
  Java 21 and Spring Boot 3.5.6. It is not a module inside `medmate-server`.
- Each clinic has its own database on the shared Postgres instance. The
  service resolves the database from the `clinicId` in the access token, using
  a `clinic_registry` table on the shared instance.
- The registry is the only table shared between clinics. It holds `clinic_id`,
  `database_name` and `display_name`, and no credentials.
- Every clinic database is reached with one service role whose secret comes
  from Secrets Manager, so a clinic's credentials are not in the registry and
  not in the code.
- Identity stays in `medmate-server`. The clinic service validates the token
  and never owns an account.
- The doctor portal and the clinic service share no code. The portal talks to
  the service over HTTP through its own origin.

## Consequences

- There is a second backend service to build, run, deploy and observe. It has
  its own database, its own migrations and its own Terraform stack.
- Clinic data cannot be reached through `medmate-server`, and the pharmacy
  CRM cannot reach clinic data. A clinic table added later does not affect the
  pharmacy schema.
- One database per clinic means one migration run per clinic, and a clinic
  cannot be handed over or deleted by moving a tenant column.
- `medmate-server` still changes, because the clinic account type and the
  tenant claim live there. That is an ADR in
  `packages/docs/medmate-server/decisions/`.
- The existing Next.js doctor app on Netlify is not moved into this
  repository. The new portal starts empty and is seeded with the demo clinic.
