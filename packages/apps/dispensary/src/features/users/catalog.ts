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
