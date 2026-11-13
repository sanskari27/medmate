# Pharmacy report permissions

## Context

The dispensary screen is [Reports hub](../../dispensary/requirements/2026-11-13-reports-hub.md). Staff who may open that hub, and staff who may later export a report, need keys on the closed pharmacy catalog. This change adds those keys only. It does not read the old server-core service.

## Scope

- Permission keys `reports:read` and `reports:export` on the closed pharmacy catalog.

## Non-goals

- A reports module, table, or HTTP route.
- Computing a report, a period, or a file.
- An ADR.
- Reading `server_core`, `app-uploads/server-core/`, or `/medmate-repo/server-core/*`.

## Behavior

`PharmacyPermissions` accepts `reports:read` and `reports:export`. A key outside the catalog stays invalid. An approved owner already passes every pharmacy key. A staff member can be saved with either key. The dispensary uses `reports:read` to show the hub. `reports:export` does not open the hub. The report routes that check these keys are [Pharmacy reports](2026-11-13-pharmacy-reports.md).

## Acceptance criteria

- `reports:read` and `reports:export` are valid keys.
- `billing:nope` stays invalid.

## Tests

- `AccessTest` for `reports:read` and `reports:export`.
- No integration test and no Bruno request.
