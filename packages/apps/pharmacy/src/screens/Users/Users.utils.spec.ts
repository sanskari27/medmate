import { describe, expect, it } from "vitest";
import type { StaffUser } from "@/utils";
import {
  buildCredentialMessage,
  countActiveUsers,
  countUsersWithLogin,
  setPermissionGroup,
  staffNameIsValid,
  togglePermission,
  userHasFullAccess,
  usernameWithoutSpaces,
} from "./Users.utils";

function staff(overrides: Partial<StaffUser> = {}): StaffUser {
  return {
    id: "user-1",
    name: "Priya Sharma",
    role: "Cashier",
    phone: "+91 90000",
    email: "priya@pharmacy.in",
    active: true,
    pin: "0000",
    username: "priya.cashier",
    password: "secret",
    permissions: ["pos"],
    lastActiveMins: 0,
    ...overrides,
  };
}

describe("user directory helpers", () => {
  const users = [staff(), staff({ id: "user-2", active: false, username: "", password: "" })];

  it("counts active members and members who can sign in", () => {
    expect(countActiveUsers(users)).toBe(1);
    expect(countUsersWithLogin(users)).toBe(1);
  });

  it("treats owners as full access", () => {
    expect(userHasFullAccess(staff({ role: "Owner", permissions: [] }))).toBe(true);
    expect(userHasFullAccess(staff())).toBe(false);
  });

  it("requires a trimmed name before save", () => {
    expect(staffNameIsValid("  Priya  ")).toBe(true);
    expect(staffNameIsValid("   ")).toBe(false);
  });

  it("toggles one permission and a whole group", () => {
    expect(togglePermission(["pos"], "pos")).toEqual([]);
    expect(togglePermission(["pos"], "inventory")).toEqual(["pos", "inventory"]);
    expect(setPermissionGroup(["pos", "inventory"], ["pos"], true)).toEqual(["inventory"]);
    expect(setPermissionGroup(["pos"], ["inventory"], false)).toEqual(["pos", "inventory"]);
  });

  it("strips spaces from a login id and builds the share message", () => {
    expect(usernameWithoutSpaces("priya sharma")).toBe("priyasharma");
    expect(buildCredentialMessage(staff(), "Green Cross")).toContain("Login ID: priya.cashier");
    expect(buildCredentialMessage(staff(), "Green Cross")).toContain("Password: secret");
  });
});
