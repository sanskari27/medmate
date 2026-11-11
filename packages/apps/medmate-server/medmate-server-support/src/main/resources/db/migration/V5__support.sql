CREATE TABLE support_faq (
    id UUID PRIMARY KEY,
    question TEXT NOT NULL,
    answer TEXT NOT NULL,
    position INT NOT NULL,
    published BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL,
    updated_at TIMESTAMPTZ NOT NULL
);

CREATE TABLE support_case (
    id UUID PRIMARY KEY,
    ticket_number BIGINT GENERATED ALWAYS AS IDENTITY UNIQUE,
    pharmacy_id UUID NOT NULL REFERENCES pharmacy (id) ON DELETE CASCADE,
    opened_by UUID NOT NULL REFERENCES account (id),
    subject TEXT NOT NULL,
    category TEXT NOT NULL,
    status TEXT NOT NULL,
    assignee_id UUID REFERENCES account (id),
    created_at TIMESTAMPTZ NOT NULL,
    resolved_at TIMESTAMPTZ,
    resolved_by UUID REFERENCES account (id),
    CONSTRAINT support_case_status CHECK (status IN ('waiting', 'open', 'resolved'))
);

CREATE INDEX support_case_created ON support_case (created_at DESC, id DESC);
CREATE INDEX support_case_pharmacy_created ON support_case (pharmacy_id, created_at DESC);

CREATE TABLE support_message (
    id UUID PRIMARY KEY,
    case_id UUID NOT NULL REFERENCES support_case (id) ON DELETE CASCADE,
    author_id UUID NOT NULL REFERENCES account (id),
    body TEXT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL
);

CREATE INDEX support_message_case_created ON support_message (case_id, created_at, id);

INSERT INTO support_faq (id, question, answer, position, published, created_at, updated_at)
VALUES
    (
        '00000000-0000-4000-8000-000000000101',
        $faq$How do I add a new medicine to inventory?$faq$,
        $faq$Go to Inventory → Add product, or simply enter a distributor bill under Purchases → New purchase entry and stock is created automatically.$faq$,
        1,
        TRUE,
        now(),
        now()
    ),
    (
        '00000000-0000-4000-8000-000000000102',
        $faq$How is GST calculated on my invoices?$faq$,
        $faq$Selling prices (MRP) are GST-inclusive. The invoice backs out the taxable value and splits tax into CGST + SGST per slab automatically. Configure invoice text under Invoice Settings.$faq$,
        2,
        TRUE,
        now(),
        now()
    ),
    (
        '00000000-0000-4000-8000-000000000103',
        $faq$Can I hide certain medicines from the online store?$faq$,
        $faq$Yes — open Online Store and toggle a product off, or use the toggle in Inventory. Hidden items stay available for counter billing only.$faq$,
        3,
        TRUE,
        now(),
        now()
    ),
    (
        '00000000-0000-4000-8000-000000000104',
        $faq$How do I reorder stock from my distributor?$faq$,
        $faq$Open Reorder · Distributor. Low-stock items are grouped by their allotted distributor with suggested quantities — adjust and Send order. When goods arrive, record the bill under Purchases.$faq$,
        4,
        TRUE,
        now(),
        now()
    ),
    (
        '00000000-0000-4000-8000-000000000105',
        $faq$How do I share reports with my CA?$faq$,
        $faq$Open CA / Accountant, add your accountant, pick the period and reports, and tap Share. The share is saved on this account. Email is not sent automatically.$faq$,
        5,
        TRUE,
        now(),
        now()
    ),
    (
        '00000000-0000-4000-8000-000000000106',
        $faq$What happens when my subscription expires?$faq$,
        $faq$Billing and saved data stay safe. Online store and some advanced features pause until you renew under Subscription.$faq$,
        6,
        TRUE,
        now(),
        now()
    );
