# Manage users

Route `/users`. The owner adds staff logins and sets the four staff role key sets. A pharmacy has one owner, and that owner is not created here. See [Pharmacy staff login](../auth/pharmacy-staff-login.md).

Opening it requires `users:read`. The screen stays open on Essential.

## What the user sees

Cards show team size, seats used against the plan limit, how many people have a login, and that access is controlled by role. Flagship has no seat ceiling. At the ceiling the screen says the seat limit is reached and a user must be deactivated or Namma MedMate must add seats.

The table columns are Member, Role, Login credentials, Access, and Status. Access shows how many of that role’s keys are true. An empty team has no empty-state sentence.

The role editor lists every key in [Permissions](../access/permissions.md), grouped by screen. Keys that are false on the owner are visible and cannot be turned on.

## Actions

| Action | Key | What happens |
| --- | --- | --- |
| Add user | `users:create` | Opens the form. Disabled when no seat is left. |
| Change role, name, phone, email, or PIN | `users:update` | Saves that staff login. |
| Turn the role’s keys on or off | `users:update` | Saves the role set. A key the owner does not have cannot be set true. |
| Turn a login active or inactive | `users:toggle_active` | The person can sign in only while the login is active. The owner’s login cannot be switched off here. |
| Share credentials | `users:share` | Opens WhatsApp, SMS, or email for the user to send. Nothing is sent by the server. |

The owner’s own keys are not on this screen.

## Fields

Name is required. Role is one of pharmacist, inventory-manager, ward-attendant, or accountant. Phone, email, login id, and a 4-digit PIN are collected. Login id and password are filled in when left blank. The password is shown so it can be shared. See [Pharmacy staff login](../auth/pharmacy-staff-login.md) for the first sign-in.

## Alerts

Add asks “Add this staff login?” Update asks “Update this staff login?” The active switch asks “Change this person's access?”

Success on create toasts “{name} added”. Update and the active switch have no success toast. Failures: “Could not add the user”, “Could not update the user”, “User not found”, “Sign in required”.

## States

No loading or error panel on the screen. The seat-limit line is the blocked state. Failures use the shell fault banner.

## API

No call on open. Users come from `GET /api/v1/session`.

`POST /api/v1/users` creates a login. The body is name, phone, email, role, PIN, login id, password, and active. The response body is not given a type. Success reloads the session.

`PATCH /api/v1/users/{id}` updates the login or the active flag. The body is the changed fields. The response body is not given a type. The session is not reloaded.

Role keys are saved with the role, not with the user id. The current app still posts a permission list on the user. See Current app.

Share, copy, and reveal do not call the API.

## Current app

The screen edits a permission list on each user. Roles on the form are Owner, Manager, Pharmacist, and Cashier. A new user starts as Cashier with PIN `0000`. The owner row cannot be edited. The target is one key set per staff role, and no per-user list.

## Related documents

- [Permissions](../access/permissions.md)
- [Pharmacy staff login](../auth/pharmacy-staff-login.md)
- [Plans](../auth/plans.md)
