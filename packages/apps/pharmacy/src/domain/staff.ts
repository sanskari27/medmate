// ── staff & roles ───────────────────────────────────────────────
export type UserRole = "Owner" | "Manager" | "Pharmacist" | "Cashier";
export const ROLE_PERMS: Record<UserRole, string[]> = {
  Owner: ["Full access", "Billing", "Inventory", "Reports & accounts", "Manage users", "Settings"],
  Manager: ["Billing", "Inventory", "Purchases", "Reports", "Online store"],
  Pharmacist: ["Billing", "Prescriptions", "Inventory", "Dispense Rx"],
  Cashier: ["Billing / POS", "Counter orders"],
};
export type StaffUser = { id: string; name: string; role: UserRole; phone: string; email: string; active: boolean; lastActiveMins: number; pin: string; username?: string; password?: string; permissions?: string[] };

// ── granular module permissions (what a user can see & use) ──────
export type PermModule = { key: string; label: string; desc: string };
export type PermGroup = { group: string; items: PermModule[] };
export const PERMISSION_CATALOG: PermGroup[] = [
  { group: "Sales & billing", items: [
    { key: "pos", label: "Billing / POS", desc: "Create bills & take payments" },
    { key: "orders", label: "Online orders", desc: "View & fulfil delivery orders" },
    { key: "prescriptions", label: "Prescriptions", desc: "View & dispense Rx" },
    { key: "credit", label: "Credit / Khata", desc: "Customer credit ledgers" },
  ] },
  { group: "Inventory", items: [
    { key: "inventory", label: "Inventory & stock", desc: "Stock, batches & expiry" },
    { key: "purchases", label: "Purchases", desc: "Record supplier purchases" },
    { key: "rackmap", label: "Rack & locations", desc: "Arrange medicine racks" },
    { key: "distributors", label: "Distributors", desc: "Supplier directory" },
  ] },
  { group: "Insights", items: [
    { key: "dashboard", label: "Dashboard", desc: "Sales analytics & KPIs" },
    { key: "reports", label: "Reports & accounts", desc: "Financial reports & GST" },
    { key: "crm", label: "CRM / Patients", desc: "Customer 360° profiles" },
  ] },
  { group: "Store & administration", items: [
    { key: "online_store", label: "Online store & offers", desc: "Storefront & promotions" },
    { key: "employees", label: "Employees & payroll", desc: "HR records & documents" },
    { key: "users", label: "Manage users", desc: "Add staff & set access" },
    { key: "settings", label: "Settings & billing setup", desc: "Business & invoice config" },
  ] },
];
export const PERM_LABEL: Record<string, string> = Object.fromEntries(
  PERMISSION_CATALOG.flatMap((g) => g.items.map((i) => [i.key, i.label])),
);
export const ALL_PERM_KEYS: string[] = PERMISSION_CATALOG.flatMap((g) => g.items.map((i) => i.key));
export const ROLE_DEFAULT_PERMS: Record<UserRole, string[]> = {
  Owner: [...ALL_PERM_KEYS],
  Manager: ["dashboard", "pos", "orders", "prescriptions", "credit", "inventory", "purchases", "rackmap", "distributors", "reports", "crm", "online_store"],
  Pharmacist: ["pos", "orders", "prescriptions", "inventory", "rackmap", "crm"],
  Cashier: ["pos", "orders", "credit"],
};
// Effective permission set for a user (explicit list, else role defaults)
export const userPerms = (u: StaffUser): string[] => u.permissions ?? ROLE_DEFAULT_PERMS[u.role];
export const ROUTE_PERM: Record<string, string> = {
  dashboard: "dashboard", pos: "pos", orders: "orders", prescriptions: "prescriptions", khata: "credit",
  crm: "crm", inventory: "inventory", rackmap: "rackmap", purchases: "purchases", reorder: "purchases",
  distributors: "distributors", online: "online_store", offers: "online_store", reports: "reports",
  expenses: "reports", employees: "employees", users: "users", settings: "settings", invoicing: "settings",
};
export const canSeeRoute = (route: string, role?: string, permissions?: string[]) => {
  const key = ROUTE_PERM[route];
  if (!key || !role || role === "Owner") return true;
  return (permissions ?? []).includes(key);
};
// Human-friendly password: Capitalised base + symbol + 4 digits. Call inside an event handler only.
export const genPassword = (name?: string): string => {
  const base = (name || "Namma").replace(/[^a-zA-Z]/g, "").slice(0, 8) || "Namma";
  const cap = base.charAt(0).toUpperCase() + base.slice(1).toLowerCase();
  const n = 1000 + Math.floor(Math.random() * 9000);
  return `${cap}@${n}`;
};
export const suggestUsername = (name: string, role: UserRole): string => {
  const first = (name.trim().split(/\s+/)[0] || "user").toLowerCase().replace(/[^a-z0-9]/g, "");
  const tag = role === "Owner" ? "owner" : role === "Manager" ? "mgr" : role === "Pharmacist" ? "rx" : "pos";
  return `${first || "user"}.${tag}`;
};
