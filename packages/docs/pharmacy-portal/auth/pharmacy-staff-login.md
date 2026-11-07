# Pharmacy staff login

The pharmacy owner creates the other pharmacy users. Creation is allowed only after the pharmacy is approved. See [Pharmacy signup](pharmacy-signup.md).

A pharmacy has one owner. The owner account comes from signup, not from this screen.

## Roles

- pharmacist
- inventory-manager
- ward-attendant
- accountant

The owner chooses one of these roles when creating the user. The same role shares one set of permission keys. There is no separate permission list on the user.

The owner sets those four role key sets on Manage Users. A key can be set true only when it is true on the owner. The owner cannot change the owner’s own keys. An admin master does that. See [Permissions](../access/permissions.md) and [Overview](overview.md).

## Fields

The owner enters:

- Name
- Phone
- Email
- Role

The role selects that role’s key set. The owner does not pick keys on the person.

## Seats

The owner counts as one seat. The app blocks creation when the plan has no seat left.

| Plan | Included seats | Other users the owner can create |
| --- | --- | --- |
| Essential | 2 | 1 |
| Care | 2 | 1 |
| Growth | 5 | 4 |
| Flagship | Unlimited | No seat limit |

Plan names, prices, and upgrades are in [Plans](plans.md).

## First login

The staff member enters the phone number the owner saved, then chooses email or phone for the OTP.

The app sends a 6-digit OTP to that channel.

The portal opens only after they save a 4-digit PIN.

## Later sign-in

The staff member signs in with the phone number and the PIN.

## PIN reset

Each time they reset the PIN, they choose email or phone. The app sends a 6-digit OTP, and they set a new PIN.

A pharmacy user signs in with a PIN. Resetting access means resetting that PIN.
