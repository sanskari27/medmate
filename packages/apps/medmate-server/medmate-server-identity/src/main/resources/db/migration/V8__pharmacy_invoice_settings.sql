ALTER TABLE pharmacy
    ADD COLUMN invoice_template TEXT NOT NULL DEFAULT 'classic',
    ADD COLUMN invoice_accent TEXT NOT NULL DEFAULT '#1B3D29',
    ADD COLUMN invoice_title TEXT NOT NULL DEFAULT 'TAX INVOICE',
    ADD COLUMN invoice_signatory TEXT NOT NULL DEFAULT 'Authorised signatory',
    ADD COLUMN invoice_bank_line TEXT NOT NULL DEFAULT '',
    ADD COLUMN invoice_show_logo BOOLEAN NOT NULL DEFAULT TRUE,
    ADD COLUMN invoice_show_stamp BOOLEAN NOT NULL DEFAULT FALSE,
    ADD COLUMN invoice_show_bank BOOLEAN NOT NULL DEFAULT FALSE;
