# Website leads

## Context

Namma MedMate already posts contact, demo, and early-access forms to `POST /api/v1/leads`. The pharmacy site still posts its contact and pharmacy-partner forms to Netlify. Nothing in medmate-server stores either set. The admin screen is [Website leads](../../admin/requirements/2026-11-14-website-leads.md). The module boundary is [0022](../decisions/0022-website-leads.md). This does not read the old server-core service.

## Scope

- A new `medmate-server-leads` module and `V21__website_leads.sql`.
- Public `POST /api/v1/leads`.
- `GET /api/v1/leads`, `GET /api/v1/leads/{id}`, and `PATCH /api/v1/leads/{id}` for platform admin and `staff:support`.
- Browser calls from `medmatepharmacy.com` as well as the origins already allowed.

## Non-goals

- Waitlist sign-ups, consultation bookings, and pharmacy support cases.
- A reply, an email, a delete, or a second status besides `new` and `contacted`.
- A pharmacy permission key, a change to `PharmacyPermissions`, or the dispensary Manage Users dialog.
- Reading `server_core`, `app-uploads/server-core/`, or `/medmate-repo/server-core/*`.

## Behavior

`POST /api/v1/leads` does not require a session. The body is JSON. `site` is `nammamedmate` or `medmatepharmacy`. `type` is `contact`, `demo`, `early-access`, or `pharmacy-partner`. A filled `companyWebsite` returns 204 and stores nothing. Any other missing required field, unknown site, unknown type, or site and type pair that is not listed below is 400 with detail `Lead is not valid` and stores nothing. Optional text that is blank is stored as null. Text is trimmed. A message or note longer than 2000 characters, or any other text field longer than 200 characters, is `Lead is not valid`. A pharmacy phone must be a 10-digit Indian mobile starting with 6, 7, 8, or 9. An email, when present, must contain a name, an `@`, and a dot in the domain.

The accepted pairs and their required fields are:

- `nammamedmate` `contact`: name, email, subject, message
- `nammamedmate` `demo`: name, phone, pharmacyName, cityPincode, preferredTime
- `nammamedmate` `early-access`: name, phone, pharmacyName, cityPincode, monthlySales
- `medmatepharmacy` `contact`: name, phone, subject, message, and `consent` true
- `medmatepharmacy` `pharmacy-partner`: name, phone, pharmacyName, area, city, plan, preferredTime, and `consent` true

A saved row starts as `new`. The response is 201 with `lead`. `lead` is the stored row: `id`, `site`, `type`, `status`, `createdAt`, `name`, `phone`, `email`, `pharmacyName`, `cityPincode`, `area`, `city`, `preferredTime`, `monthlySales`, `subject`, `message`, `source`, `notes`, `plan`, and `consent`. `createdAt` is an instant. The honeypot is not stored.

`GET /api/v1/leads`, `GET /api/v1/leads/{id}`, and `PATCH /api/v1/leads/{id}` require a non-disabled platform admin or a non-disabled staff account whose subtypes include `support`. Anyone else, including a missing session, a pharmacy owner, and any other staff subtype, receives 403 with detail `This action is not allowed.` A bearer the existing JWT filter rejects stays 401 with detail `Session was not accepted`.

`GET /api/v1/leads` uses the shared page parser. A bad page is `Page is not valid`. Omitted filters mean every row. `status` is `new` or `contacted`. `site` is one of the two sites. `type` is one of the four forms. Any other value is 400 with `Status is not valid`, `Site is not valid`, or `Form is not valid`. Rows are newest `createdAt` first, then id. The response is `leads`, `page`, `size`, and `total`. A list row is `id`, `site`, `type`, `status`, `name`, `phone`, `email`, and `createdAt`.

`GET /api/v1/leads/{id}` returns `lead` with every stored field. An unknown id is 404 with detail `Lead was not found`.

`PATCH /api/v1/leads/{id}` body is `{ "status": "new" | "contacted" }`. Both directions are allowed, including the status the row already has. The response is the same `lead` shape as create. Any other body is 400 `Status is not valid`. An unknown id is 404 `Lead was not found`.

| Status | Detail |
| --- | --- |
| 400 | `Lead is not valid` |
| 400 | `Page is not valid` |
| 400 | `Status is not valid` |
| 400 | `Site is not valid` |
| 400 | `Form is not valid` |
| 403 | `This action is not allowed.` |
| 404 | `Lead was not found` |

## Acceptance criteria

- A Namma contact, demo, and early-access body, and a pharmacy contact and pharmacy-partner body, are stored as `new`. A filled honeypot stores nothing.
- A staff member whose subtypes include `support`, and a platform admin, can list, open, and mark a row `contacted` and back to `new`. A pharmacy owner and a finance staff member receive 403. A request with no session receives 403 on the read and the update.
- Page 1 of 26 rows with `size` 25 returns 25 rows and `total` 26. A `site` filter excludes the other site. `size=101` and `status=nope` are 400.
- `https://medmatepharmacy.com` is allowed on a preflight. `https://evil.example` is not.

## Tests

- `LeadRulesTest` for the five required shapes, the honeypot, both status directions, and a bad filter.
- `LeadControllerTest` for anonymous create, 400, 403, and 404.
- `LeadIT` for a stored row, a page of 25, one site filter, and a status change.
- Bruno requests `leads/create-lead.bru`, `leads/list-leads.bru`, `leads/read-lead.bru`, and `leads/update-lead-status.bru`.
