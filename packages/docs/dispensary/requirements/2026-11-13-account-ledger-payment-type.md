# Account ledger payment type

## Context

The Credit dialog on CRM - Patients lists the account ledger. A repayment is collected as Cash, UPI, or Card, and that mode is already stored. The ledger line currently reads `Repayment`, so the mode is not visible. The pharmacy khata ledger puts the mode, and any note, in that line's label. This portal copies that label and does not import the pharmacy app.

## Scope

- The Credit dialog account ledger on `/patients`.
- Repayment lines returned by `GET /pharmacy/patients/{phone}`.

## Non-goals

- A new ledger field. The existing `label` carries the mode.
- Changing credit-bill lines (`Credit bill`) or return lines (`Return`).
- The collect form, the other patient dialogs, the admin portal, and the pharmacy app.

## Behavior

A repayment ledger line keeps its place: label, then reference and date, then the signed amount. The label is `Repayment · Cash`, `Repayment · UPI`, or `Repayment · Card`, using the stored mode. When the repayment has a note, the label continues with ` · ` and that note, for example `Repayment · UPI · Counter`. A blank note adds nothing. Credit-bill and return labels stay unchanged.

## Acceptance criteria

- Opening Credit for a patient with a cash repayment shows `Repayment · Cash` on that ledger line.
- A repayment stored with a note shows the mode and the note in the same label.
- A credit bill still shows `Credit bill`. A return still shows `Return`.

## Tests

- `PatientRulesTest` for a cash repayment label, a UPI repayment label that includes the note, and unchanged credit-bill and return labels.
- `PatientsPage.test.tsx` for a repayment line reading `Repayment · UPI` inside the Credit dialog.
