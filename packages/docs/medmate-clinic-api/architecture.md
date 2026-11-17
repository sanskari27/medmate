# Clinic API architecture

## What it is

A Spring Boot service that gives the doctor portal a clinic's data, and nothing
else. It does not authenticate anybody: medmate-server does that, and this
service trusts the token it is handed.

## The request path

```
doctor portal  ── bearer token ──►  Clinic API
                                        │
                    1. verify HS256 signature with the shared secret
                    2. read the clinicId and clinicRole claims
                                        │
                    3. clinic_registry lookup: clinicId ──► database_name
                                        │
                    4. connect to THAT clinic's database
                                        │
                    5. read the caller's grants from clinic_grant
                                        │
                    6. run the query, omitting the fields the grants
                       do not allow
```

The database *is* the tenant boundary. There is no `clinic_id` column on a
patient row, because a patient row can only ever exist in the database of the
clinic that owns it.

## Why it fails closed

A token for a clinic that is not in the registry is a `503` with the detail
`Clinic records are unavailable`. It never falls back to another clinic's
database, and it never answers as if the clinic had no patients - an empty
result and a failure are different things, and only one of them is true.

## The permission model

A clinic account holds its own grants, in its own database, in the
`clinic_grant` table. The four grant keys are:

| Grant | Allows |
| --- | --- |
| `clinic:patients:read` | The patient list: name, age, sex, masked phone, status |
| `clinic:patients:read_clinical` | Conditions, allergies, health ID, last-seen doctor |
| `clinic:billing:read` | The outstanding amount on a patient |
| `clinic:staff:read` | The clinic's staff list |

Redaction omits a field; it never nulls it. A caller without the clinical
grant receives an item with no `conditions` key at all, so a client cannot
mistake "not permitted" for "recorded as unknown".

Removing a grant takes effect on the next request, because the grants are read
per request rather than baked into the token.

## Data

| Collection | Where | What |
| --- | --- | --- |
| `clinic_registry` | The service's own database | One row per clinic: id, database name, display name |
| `clinic_grant` | Each clinic's database | Which grants an account holds |
| `patient` | Each clinic's database | That clinic's patients |
| `prescription`, `visit`, `invoice` | Each clinic's database | That clinic's clinical and financial records |

The registry is the only table shared between clinics.

## Boundaries

- It shares no code with `medmate-server`. It re-implements the
  `ProblemDetail` error shape in its own package.
- It is a separate Maven reactor, so it cannot accidentally depend on the
  pharmacy CRM.
- It does not own an account, a role or a password.

## Related

- Requirement: `packages/docs/doctor/requirements/2026-11-17-clinic-sign-in-and-patients.md`
- Decisions: `packages/docs/doctor/decisions/0001-clinic-api-and-database-per-clinic.md`
- The client: `packages/docs/doctor/README.md`
