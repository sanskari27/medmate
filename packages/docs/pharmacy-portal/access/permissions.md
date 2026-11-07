# Permissions

Permission keys are fixed. A key is set true or false. Keys are not created or removed in the app.

The key format is `screen_name:action`. `read` shows the screen. Each other key shows or hides that button or action.

A control that only opens another screen uses that screen’s `read` key. Sign-out is available to every signed-in user and has no key.

## Who can act

The pharmacy owner’s record has every key. A new owner starts with every key true. An admin user with the master role sets the owner’s keys true or false. The owner cannot change their own keys. The admin screens are not in this portal. See [Admin login](../auth/admin-login.md).

The owner sets the keys for the four staff roles on Manage Users: pharmacist, inventory-manager, ward-attendant, and accountant. The owner can set a role key true only when that key is true on the owner. There is no separate list on each staff user.

A staff user can perform an action only when the key is true on the owner and true on that user’s role.

The plan still wins. A true key does not open a screen the plan does not include. See [Plans](../auth/plans.md) and [Portal shell](../shell/portal-shell.md).

Hospital screens stay hidden unless the pharmacy business type is hospital. That check is separate from these keys.

## Keys

| Screen | Keys |
| --- | --- |
| Dashboard | `dashboard:read` |
| Billing / POS | `pos:read`, `pos:create`, `pos:send_to_reception`, `pos:print`, `pos:share` |
| Orders | `orders:read`, `orders:update`, `orders:cancel`, `orders:pack`, `orders:handover`, `orders:mark_paid`, `orders:print`, `orders:share` |
| Sales | `sales:read`, `sales:export`, `sales:print` |
| Sales register | `sales_register:read`, `sales_register:export` |
| Inventory | `inventory:read`, `inventory:import`, `inventory:update`, `inventory:toggle_online`, `inventory:toggle_loose`, `inventory:export` |
| Rack map | `rack_map:read`, `rack_map:create`, `rack_map:assign`, `rack_map:update`, `rack_map:export`, `rack_map:print` |
| Purchases | `purchases:read`, `purchases:create`, `purchases:import` |
| Reorder | `reorder:read`, `reorder:create`, `reorder:update`, `reorder:import`, `reorder:mark_received` |
| Distributors | `distributors:read`, `distributors:create`, `distributors:update`, `distributors:create_supply`, `distributors:update_supply`, `distributors:set_preferred` |
| Prescriptions | `prescriptions:read`, `prescriptions:approve`, `prescriptions:reject`, `prescriptions:dispense`, `prescriptions:notify` |
| Customers | `customers:read`, `customers:export`, `customers:record_payment`, `customers:remind` |
| Khata | `khata:read`, `khata:record_payment`, `khata:remind` |
| CRM | `crm:read`, `crm:update`, `crm:create_campaign`, `crm:create_feedback`, `crm:remind`, `crm:request_feedback`, `crm:redeem` |
| Online store | `online_store:read`, `online_store:update` |
| Offers | `offers:read`, `offers:create`, `offers:update` |
| Kiosk | `kiosk:read`, `kiosk:update`, `kiosk:create` |
| Reports | `reports:read`, `reports:export`, `reports:print` |
| Expenses | `expenses:read`, `expenses:create`, `expenses:export`, `expenses:print` |
| CA / Accountant | `chartered_accountant:read`, `chartered_accountant:create`, `chartered_accountant:update`, `chartered_accountant:share` |
| Invoice settings | `invoice_settings:read`, `invoice_settings:update`, `invoice_settings:print` |
| Employees | `employees:read`, `employees:create`, `employees:update`, `employees:export`, `employees:print` |
| Manage users | `users:read`, `users:create`, `users:update`, `users:toggle_active`, `users:share` |
| Account | `account:read`, `account:export`, `account:save_bank`, `account:verify_bank` |
| Subscription | `subscription:read`, `subscription:request_plan`, `subscription:request_renewal`, `subscription:toggle_auto_renew`, `subscription:preview_coupon`, `subscription:redeem` |
| Settings | `settings:read`, `settings:update`, `settings:run_setup` |
| Support | `support:read`, `support:create` |
| Referrals | `referrals:read`, `referrals:create`, `referrals:update`, `referrals:share` |
| Wards | `wards:read`, `wards:create`, `wards:update`, `wards:admit`, `wards:discharge`, `wards:settle` |
| Indents | `indents:read`, `indents:update` |
| Departments | `departments:read`, `departments:create`, `departments:update` |
| Doctors | `doctors:read`, `doctors:create`, `doctors:update` |
| Active patients | `patient_bills:read`, `patient_bills:settle` |
| Hospital billing | `hospital_billing:read`, `hospital_billing:issue`, `hospital_billing:return`, `hospital_billing:record_payment`, `hospital_billing:update`, `hospital_billing:unlock_pricing`, `hospital_billing:remind`, `hospital_billing:export`, `hospital_billing:print` |

Changing an order from Sales uses the Orders keys. Issuing a ward indent uses `hospital_billing:issue`. The store-open switch on Settings uses `online_store:update`. These screens do not delete records, so there is no `delete` key.

The CRM keys match the CRM screen that exists today. They do not describe a wider CRM. See [CRM](../customers/crm.md).

## Role defaults

The owner starts with every key true. A dash means the key starts false.

| Screen | Pharmacist | Inventory-manager | Ward-attendant | Accountant |
| --- | --- | --- | --- | --- |
| Dashboard | read | read | read | read |
| Billing / POS | read, create, send_to_reception, print, share | read | — | read |
| Orders | read, update, cancel, pack, handover, mark_paid, print, share | — | — | read, mark_paid |
| Sales | read | read | — | read, export, print |
| Sales register | — | — | — | read, export |
| Inventory | read | read, import, update, toggle_online, toggle_loose, export | — | — |
| Rack map | read | read, create, assign, update, export, print | — | — |
| Purchases | — | read, create, import | — | — |
| Reorder | — | read, create, update, import, mark_received | — | — |
| Distributors | — | read, create, update, create_supply, update_supply, set_preferred | — | — |
| Prescriptions | read, approve, reject, dispense, notify | — | read | — |
| Customers | read, remind | — | — | read, export, record_payment, remind |
| Khata | read, remind | — | — | read, record_payment, remind |
| CRM | read, update, remind, request_feedback, redeem | — | — | read |
| Online store | read | read, update | — | — |
| Offers | — | read, create, update | — | — |
| Kiosk | read | read, update | — | — |
| Reports | — | read, export | — | read, export, print |
| Expenses | — | — | — | read, create, export, print |
| CA / Accountant | — | — | — | read, create, update, share |
| Invoice settings | — | — | — | read, update, print |
| Employees | — | — | — | read, export |
| Manage users | — | — | — | — |
| Account | read | read | read | read, export, save_bank, verify_bank |
| Subscription | read | read | read | read, request_plan, request_renewal |
| Settings | — | — | — | — |
| Support | read, create | read, create | read, create | read, create |
| Referrals | — | — | — | — |
| Wards | — | — | read | read, settle |
| Indents | — | — | read | — |
| Departments | — | — | read | — |
| Doctors | read | — | read | — |
| Active patients | — | — | read | read, settle |
| Hospital billing | — | — | read | read, record_payment, remind, export, print |

Manage users, settings, referrals, coupon redeem, auto-renew, and pricing unlock start with the owner only. Reports is one screen, so `reports:read` shows the GST and profit reports as well as the stock reports.

## Current app

The signed-in app uses the role names Owner, Manager, Pharmacist, and Cashier. It checks one module key per route, and some routes have no key, so every signed-in user can open them. The owner bypasses those checks. A saved permission list on the user replaces the role default. The target is the keys and role flags in this document.

## Related documents

- [Portal shell](../shell/portal-shell.md)
- [Manage users](../people/users.md)
- [Admin login](../auth/admin-login.md)
- [Pharmacy staff login](../auth/pharmacy-staff-login.md)
- [Plans](../auth/plans.md)
