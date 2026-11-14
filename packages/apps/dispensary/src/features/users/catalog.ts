export type PermissionAction = {
  key: string;
  label: string;
};

export type PermissionModule = {
  module: string;
  actions: PermissionAction[];
};

export type PermissionArea = {
  area: string;
  modules: PermissionModule[];
};

export const PERMISSION_AREAS: PermissionArea[] = [
  {
    area: "Counter",
    modules: [
      {
        module: "Billing",
        actions: [
          { key: "billing:read", label: "Read" },
          { key: "billing:create", label: "Charge" },
        ],
      },
      {
        module: "Sales",
        actions: [
          { key: "sales:read", label: "Read" },
          { key: "sales:return", label: "Return" },
        ],
      },
      {
        module: "CRM · Patients",
        actions: [
          { key: "patients:read", label: "Read" },
          { key: "patients:update", label: "Update" },
        ],
      },
    ],
  },
  {
    area: "Hospital",
    modules: [
      {
        module: "Doctors",
        actions: [
          { key: "doctors:read", label: "Read" },
          { key: "doctors:create", label: "Create" },
          { key: "doctors:update", label: "Update" },
        ],
      },
      {
        module: "Departments",
        actions: [
          { key: "departments:read", label: "Read" },
          { key: "departments:create", label: "Create" },
          { key: "departments:update", label: "Update" },
        ],
      },
      {
        module: "Wards",
        actions: [
          { key: "wards:read", label: "Read" },
          { key: "wards:create", label: "Create" },
          { key: "wards:update", label: "Update" },
          { key: "wards:admit", label: "Admit" },
          { key: "wards:transfer", label: "Transfer" },
          { key: "wards:discharge", label: "Discharge" },
        ],
      },
    ],
  },
  {
    area: "Management",
    modules: [
      {
        module: "Manage users",
        actions: [
          { key: "users:read", label: "Read" },
          { key: "users:create", label: "Create" },
          { key: "users:update", label: "Update" },
          { key: "users:delete", label: "Delete" },
        ],
      },
      {
        module: "Manage Employees",
        actions: [
          { key: "employees:read", label: "Read" },
          { key: "employees:create", label: "Create" },
          { key: "employees:update", label: "Update" },
          { key: "employees:delete", label: "Delete" },
        ],
      },
      {
        module: "Invoice Settings",
        actions: [
          { key: "invoice-settings:read", label: "Read" },
          { key: "invoice-settings:update", label: "Update" },
        ],
      },
      {
        module: "Help & Support",
        actions: [
          { key: "support:read", label: "Read" },
          { key: "support:write", label: "Write" },
        ],
      },
    ],
  },
  {
    area: "Catalogue",
    modules: [
      {
        module: "Distributors",
        actions: [
          { key: "distributors:read", label: "Read" },
          { key: "distributors:create", label: "Create" },
          { key: "distributors:update", label: "Update" },
          { key: "distributors:delete", label: "Delete" },
          { key: "distributors:pay", label: "Pay" },
        ],
      },
      {
        module: "Purchases",
        actions: [
          { key: "purchases:read", label: "Read" },
          { key: "purchases:create", label: "Create" },
          { key: "purchases:return", label: "Return" },
        ],
      },
      {
        module: "Inventory",
        actions: [
          { key: "inventory:read", label: "Read" },
          { key: "inventory:update", label: "Update" },
          { key: "inventory:export", label: "Export" },
        ],
      },
      {
        module: "Rack & Locations",
        actions: [
          { key: "racks:read", label: "Read" },
          { key: "racks:create", label: "Create" },
          { key: "racks:update", label: "Update" },
          { key: "racks:export", label: "Export" },
        ],
      },
      {
        module: "Offers",
        actions: [
          { key: "offers:read", label: "Read" },
          { key: "offers:create", label: "Create" },
          { key: "offers:update", label: "Update" },
          { key: "offers:delete", label: "Delete" },
        ],
      },
    ],
  },
  {
    area: "Business",
    modules: [
      {
        module: "Expenses",
        actions: [
          { key: "expenses:read", label: "Read" },
          { key: "expenses:create", label: "Create" },
        ],
      },
      {
        module: "Reports",
        actions: [
          { key: "reports:read", label: "Read" },
          { key: "reports:export", label: "Export" },
        ],
      },
    ],
  },
];

export const PERMISSION_KEYS = PERMISSION_AREAS.flatMap((area) =>
  area.modules.flatMap((module) => module.actions.map((action) => action.key)),
);

export type StaffMember = {
  id: string;
  phone: string;
  displayName: string;
  permissions: string[];
  disabled: boolean;
  pinSet: boolean;
};

export type StaffDraft = {
  displayName: string;
  phone: string;
  pin: string;
  permissions: string[];
};

export function nationalPhone(phone: string): string {
  const digits = phone.replace(/\D/g, "");
  return digits.length > 10 ? digits.slice(-10) : digits;
}

export function accessLabel(permissions: string[]): string {
  const enabled = permissions.filter((key) => PERMISSION_KEYS.includes(key)).length;
  return `${enabled} / ${PERMISSION_KEYS.length}`;
}

export function togglePermission(current: string[], key: string): string[] {
  if (current.includes(key)) return current.filter((item) => item !== key);
  return [...current, key];
}
