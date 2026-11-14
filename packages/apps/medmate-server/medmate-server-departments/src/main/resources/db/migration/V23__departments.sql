CREATE TABLE department (
    id UUID PRIMARY KEY,
    pharmacy_id UUID NOT NULL REFERENCES pharmacy (id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    code TEXT NOT NULL,
    code_key TEXT NOT NULL,
    description TEXT,
    parent_department_id UUID REFERENCES department (id) ON DELETE RESTRICT,
    is_active BOOLEAN NOT NULL,
    display_order INTEGER NOT NULL,
    CONSTRAINT department_code_unique UNIQUE (pharmacy_id, code_key),
    CONSTRAINT department_display_order CHECK (display_order >= 0),
    CONSTRAINT department_not_self CHECK (parent_department_id IS NULL OR parent_department_id <> id)
);

CREATE INDEX department_pharmacy_order ON department (pharmacy_id, display_order, lower(name), lower(code));
