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
        module: "Help & Support",
        actions: [
          { key: "support:read", label: "Read" },
          { key: "support:write", label: "Write" },
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
