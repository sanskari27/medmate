import { ALL_PERM_KEYS, PERM_LABEL, userPerms, type StaffUser } from "@/utils";

export function countActiveUsers(users: StaffUser[]): number {
  return users.filter(function isActive(user) {
    return user.active;
  }).length;
}

export function countUsersWithLogin(users: StaffUser[]): number {
  return users.filter(function hasLogin(user) {
    return Boolean(user.username && user.password);
  }).length;
}

export function userHasFullAccess(user: StaffUser): boolean {
  return user.role === "Owner" || userPerms(user).length >= ALL_PERM_KEYS.length;
}

export function staffNameIsValid(name: string | undefined): boolean {
  return Boolean((name || "").trim());
}

export function togglePermission(permissions: string[], key: string): string[] {
  if (permissions.includes(key)) {
    return permissions.filter(function omitKey(item) {
      return item !== key;
    });
  }
  return [...permissions, key];
}

export function setPermissionGroup(permissions: string[], keys: string[], allSelected: boolean): string[] {
  if (allSelected) {
    return permissions.filter(function omitGroup(key) {
      return !keys.includes(key);
    });
  }
  return [...new Set([...permissions, ...keys])];
}

export function groupFullyEnabled(permissions: string[], keys: string[]): boolean {
  return keys.every(function hasKey(key) {
    return permissions.includes(key);
  });
}

export function buildCredentialMessage(user: StaffUser, pharmacy: string): string {
  const permissions = userPerms(user);
  const access = userHasFullAccess(user)
    ? "Full access"
    : permissions
        .map(function permissionLabel(key) {
          return PERM_LABEL[key];
        })
        .filter(Boolean)
        .join(", ");
  return [
    `Namma MedMate — your login for ${pharmacy}`,
    "",
    `Login ID: ${user.username}`,
    `Password: ${user.password}`,
    `Role: ${user.role}`,
    "",
    `Access: ${access}`,
    "",
    "Please sign in and change your password after first login.",
  ].join("\n");
}

export function usernameWithoutSpaces(value: string): string {
  return value.replace(/\s/g, "");
}
