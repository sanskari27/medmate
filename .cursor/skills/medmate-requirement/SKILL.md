---
name: medmate-requirement
description: >-
  Interviews a medmate-server product requirement until nothing material is
  ambiguous, writes packages/docs/medmate-server/requirements, then creates an
  implementation plan. Use when the user runs the medmate-requirement command
  or asks to specify, clarify, or document a requirement for medmate-server.
---

# medmate-requirement

Turn a requirement into a spec and a plan. Do not implement it in this workflow.

## Interview

1. If no requirement text was given, ask for it and stop.
2. Restate the requirement in a few sentences.
3. List only the gaps that would change the design or the tests: scope, non-goals, data, API, errors, auth, and acceptance checks.
4. Ask those gaps, a couple at a time. Use a fixed set of choices when the answer is closed. Do not invent product behavior to fill a gap.
5. Stop when a second person could implement the spec without guessing.

## Spec

Write `packages/docs/medmate-server/requirements/YYYY-MM-DD-<slug>.md`.

```markdown
# <title>

## Context

## Scope

## Non-goals

## Behavior

## Acceptance criteria

## Tests
```

`Tests` names the unit tests, integration tests, and Bruno request to add. A structural choice (new module, datastore, auth, or host) also names the ADR to add under `packages/docs/medmate-server/decisions/`.

## Plan

After the spec is on disk, create an implementation plan for that spec and stop. Do not edit application code, Bruno requests, or Terraform until the plan is accepted.

The plan cites the spec path, the modules to touch, the tests, and anything the plan must not pull in from the old server-core service.
