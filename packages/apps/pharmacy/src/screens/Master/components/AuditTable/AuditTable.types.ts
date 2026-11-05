type AuditRow = {
    phone: string;
    pharmacyId: string;
    pharmacyName: string;
    action: string;
    before: unknown;
    after: unknown;
    reason: string;
    at: string;
};

export type AuditTableProps = {
    rows: AuditRow[];
};
