# Pharmacy fleet

## Context

Home was an empty shell. A pharmacy page showed the application and the block state, and left rejection, custom profile lines, and the request time off the page. The figures come from [Admin pharmacy insights](../../medmate-server/requirements/2026-11-14-admin-pharmacy-insights.md).

## Scope

- `/dashboard` shows the fleet from `GET /pharmacy-insights`.
- `/pharmacies/:pharmacyId` shows the fields already on the owner payload that were hidden, plus `GET /pharmacy-insights/{id}`.
- `/reviews/:pharmacyId` shows the pharmacy id, a rejection when one is stored, and extra details when the application has them.

## Non-goals

- Search or filters on the fleet.
- Patient or employee records.
- Invoice print settings.

## Behavior

Home is headed Pharmacy fleet. It shows status counts, median days to submit and to a decision, open support cases, median resolve time, and feature adoption as "n of n". It lists verification, type, city, state, industry, registration, and business type. It lists approved pharmacies with no sale since approval, and the last-30-day rankings. A pharmacy name links to `/pharmacies/:pharmacyId`.

The pharmacy page summary adds pharmacy id, created time, and rejection stage plus comment when status is rejected. Extra details are their own group when the list is not empty. The block panel shows the open request time. Missing document slots, review history, and closed block requests sit with the documents. Activity sits under the application. The range buttons are 7 days, 30 days, and 12 months, and 30 days is selected first. Activity shows today, this month, the selected window, stock, people counts, and support cases. A failed activity read leaves the application on screen.

## Acceptance criteria

- After sign-in, Home shows Pharmacy fleet.
- A pharmacy with a rejection, extra details, and an open block request shows those on the page.
- Activity shows net sales for the selected range when the insights read succeeds, and an error line when it does not.

## Tests

- `AppRouter.test.tsx` finds Pharmacy fleet on Home.
- `PharmacyDetailPage.test.tsx` still covers block actions, and shows the pharmacy id, a rejection, extra details, and the request time.
