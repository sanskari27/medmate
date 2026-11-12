import { describe, expect, it } from "vitest";
import {
  PERMISSION_AREAS,
  PERMISSION_KEYS,
  accessLabel,
  nationalPhone,
  togglePermission,
} from "./catalog";

describe("staff permission catalog", () => {
  it("groups management actions and counts them", () => {
    expect(PERMISSION_AREAS.map((area) => area.area)).toEqual(["Management"]);
    expect(PERMISSION_AREAS[0]?.modules.map((module) => module.module)).toEqual([
      "Manage users",
      "Manage Employees",
      "Invoice Settings",
      "Help & Support",
    ]);
    expect(PERMISSION_KEYS).toEqual([
      "users:read",
      "users:create",
      "users:update",
      "users:delete",
      "employees:read",
      "employees:create",
      "employees:update",
      "employees:delete",
      "invoice-settings:read",
      "invoice-settings:update",
      "support:read",
      "support:write",
    ]);
    expect(accessLabel(["users:read", "support:write", "inventory:read"])).toBe("2 / 12");
    expect(togglePermission(["users:read"], "users:read")).toEqual([]);
    expect(togglePermission(["users:read"], "users:create")).toEqual([
      "users:read",
      "users:create",
    ]);
    expect(nationalPhone("+919876543210")).toBe("9876543210");
  });
});
