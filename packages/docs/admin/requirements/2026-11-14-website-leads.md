# Website leads

## Context

Public forms from Namma MedMate and the pharmacy site are stored by medmate-server. Platform admin and support staff need a list and a way to mark each one new or contacted. The API is [Website leads](../../medmate-server/requirements/2026-11-14-website-leads.md).

## Scope

- A Leads nav item for platform admin and for staff whose subtypes include `support`.
- `/leads` for the paged list and the filters.
- `/leads/:leadId` for the stored fields and the status control.

## Non-goals

- The dispensary portal, the pharmacy app, and the marketing sites beyond calling the API.
- Support cases, FAQs, Reviews, and Pharmacies.
- A reply, a delete, or a new permission key.

## Behavior

`canSupport` already decides who sees Support. The same check shows Leads and opens `/leads` and `/leads/:leadId`. Other staff who open either path go to `/dashboard`. The nav label is Leads. It is its own section, after Support.

`/leads` requests `GET /api/v1/leads` with `page` and `size` 25 through the portal API client. Three filters sit above the rows: status, site, and form. All is the omitted filter. Changing a filter returns to page 1. A row is a link to `/leads/:leadId`. It shows the name, the form and the phone or email, the status, and the time. The page bar matches the existing bar. An empty result says `No leads yet.`

`/leads/:leadId` has a link back to `/leads`, the name, every stored field, and two buttons, New and Contacted. The current status is the pressed button. Either button sends `PATCH /api/v1/leads/{id}` with that status. Admin and support staff both see the buttons. A failed load or save shows the problem detail.

## Acceptance criteria

- Admin and support see Leads in the nav. Finance opening `/leads` lands on Home.
- The list requests size 25, sends the selected filters, and opens a row.
- The detail shows the stored fields. New and Contacted each send that status.

## Tests

- `LeadsPage.test.tsx` for the three filters, the pager, and the row link.
- `LeadDetailPage.test.tsx` for the stored fields and both status buttons.
- `AppRouter.test.tsx` for the nav item and the finance redirect.
