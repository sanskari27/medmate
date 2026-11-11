---
name: portal-feature
description: >-
  Adds a screen or behavior to the dispensary or admin portal. Use when the
  user runs the portal-feature command, or asks to add, copy, or change a
  feature in packages/apps/dispensary or packages/apps/admin.
---

# portal-feature

Add one dispensary or admin feature without widening the change. Do not implement it in this workflow until a plan is accepted.

## Interview

1. If no feature text was given, ask for it and stop.
2. Restate which portal it belongs to. If the portal is not named, ask.
3. List only the gaps that would change the screen, the API, or the tests.
4. Ask those gaps, a couple at a time. Do not invent product behavior.

## Spec

Write `packages/docs/<app>/requirements/YYYY-MM-DD-<slug>.md`.

```markdown
# <title>

## Context

## Scope

## Non-goals

## Behavior

## Acceptance criteria

## Tests
```

## Plan

After the spec is on disk, create an implementation plan and stop.

The plan must:

- Keep the change inside one feature, and export it from that feature's `index.ts`.
- Copy pharmacy visuals without importing `packages/apps/pharmacy`. Keep element order and placement.
- Call medmate-server through the portal API client. Do not hardcode a production URL in a component.
- Name the unit tests to add.
- Leave the other portal, the pharmacy app, and unrelated screens unchanged.
