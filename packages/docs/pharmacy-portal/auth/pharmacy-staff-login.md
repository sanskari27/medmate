# Pharmacy staff login

The pharmacy owner creates the other pharmacy users. Creation is allowed only after the pharmacy is approved. See [Pharmacy signup](pharmacy-signup.md).

A pharmacy has one owner. The owner account comes from signup, not from this screen.

## Roles

- pharmacist
- inventory-manager
- ward-attendant / staff
- accountant

The owner chooses one of these roles when creating the user. Each role has its own work. The tasks and the permission list are documented with the later modules.

The owner also sets that user's permissions on this screen. A role is not a permission. See [Overview](overview.md).

## Fields

The owner enters:

- Name
- Phone
- Email
- Role
- Permissions

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
