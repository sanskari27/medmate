ALTER TABLE doctor
    ADD COLUMN department_id UUID REFERENCES department (id) ON DELETE RESTRICT;
