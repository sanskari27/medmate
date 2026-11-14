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
    expect(PERMISSION_AREAS.map((area) => area.area)).toEqual([
      "Counter",
      "Hospital",
      "Management",
      "Catalogue",
      "Business",
    ]);
    expect(PERMISSION_AREAS[0]?.modules.map((module) => module.module)).toEqual([
      "Billing",
      "Sales",
      "CRM · Patients",
    ]);
    expect(PERMISSION_AREAS[1]?.modules.map((module) => module.module)).toEqual([
      "Doctors",
      "Departments",
    ]);
    expect(PERMISSION_AREAS[2]?.modules.map((module) => module.module)).toEqual([
      "Manage users",
      "Manage Employees",
      "Invoice Settings",
      "Help & Support",
    ]);
    expect(PERMISSION_KEYS).toEqual([
      "billing:read",
      "billing:create",
      "sales:read",
      "sales:return",
      "patients:read",
      "patients:update",
      "doctors:read",
      "doctors:create",
      "doctors:update",
      "departments:read",
      "departments:create",
      "departments:update",
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
      "distributors:read",
      "distributors:create",
      "distributors:update",
      "distributors:delete",
      "distributors:pay",
      "purchases:read",
      "purchases:create",
      "purchases:return",
      "inventory:read",
      "inventory:update",
      "inventory:export",
      "racks:read",
      "racks:create",
      "racks:update",
      "racks:export",
      "offers:read",
      "offers:create",
      "offers:update",
      "offers:delete",
      "expenses:read",
      "expenses:create",
      "reports:read",
      "reports:export",
    ]);
    expect(PERMISSION_AREAS[3]?.modules.map((module) => module.module)).toEqual([
      "Distributors",
      "Purchases",
      "Inventory",
      "Rack & Locations",
      "Offers",
    ]);
    expect(PERMISSION_AREAS[4]?.modules.map((module) => module.module)).toEqual([
      "Expenses",
      "Reports",
    ]);
    expect(PERMISSION_KEYS).toHaveLength(47);
    expect(accessLabel(["users:read", "support:write", "inventory:read"])).toBe("3 / 47");
    expect(togglePermission(["users:read"], "users:read")).toEqual([]);
    expect(togglePermission(["users:read"], "users:create")).toEqual([
      "users:read",
      "users:create",
    ]);
    expect(nationalPhone("+919876543210")).toBe("9876543210");
  });
});
