# List pagination

## Context

Support cases, pharmacy owners, and the review queue load every row at once. The API is [List pagination](../../medmate-server/requirements/2026-11-13-list-pagination.md). The dispensary portal and the pharmacy app stay untouched.

## Scope

- A shared page bar with previous, next, and `page N of M`.
- Paged support cases, pharmacy owners, and the combined review queue.

## Non-goals

- The dispensary portal and the pharmacy app.
- Paging FAQs.
- Search on owners, cases, or reviews.
- A new permission.

## Behavior

The page bar matches the dispensary bar: previous, next, and `page N of M`. Both buttons are disabled when the list fits on one page.

Support cases request `page` and `size` 25. FAQs stay a full list. Pharmacies requests `GET /pharmacy-owners` with `page` and `size` 25. Reviews makes one request to `GET /pharmacy-applications` with `page` and `size` 25 and no `status`. The rows stay in the order the server returns, oldest submission first across both waiting statuses.

## Acceptance criteria

- Support cases, owners, and reviews each show the page bar and request `size` 25.
- Reviews calls the applications list once, without `status`.
- FAQs still load in one response with no page bar.

## Tests

- `SupportPage`, `PharmaciesPage`, and `ReviewsPage` for the pager and the single unfiltered reviews request.
