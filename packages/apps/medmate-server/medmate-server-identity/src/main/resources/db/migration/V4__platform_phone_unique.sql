CREATE UNIQUE INDEX account_platform_phone_uq ON account (phone)
WHERE account_type IN ('admin', 'staff');
