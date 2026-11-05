export const csvCell = (c: unknown) => `"${String(c ?? "").replace(/"/g, '""')}"`;
