import { describe, expect, it } from "vitest";
import { lockedRouteFallback, NAV, visibleNavItems } from "./DashboardLayout.utils";

const cashier = {
  role: "Cashier",
  permissions: ["pos", "orders", "credit"],
  isHospital: false,
};

describe("lockedRouteFallback", () => {
  it("hides hospital links and locked permissions", () => {
    const retail = visibleNavItems({ role: "Owner", isHospital: false });
    const hospital = visibleNavItems({ role: "Owner", isHospital: true });
    const counter = visibleNavItems(cashier);

    expect(retail.some(function hasWards(item) { return item.key === "wards"; })).toBe(false);
    expect(hospital.some(function hasWards(item) { return item.key === "wards"; })).toBe(true);
    expect(NAV.find(function catalogue(item) { return item.key === "inventory"; })?.group).toBe("Catalogue");
    expect(counter.some(function hasPos(item) { return item.key === "pos"; })).toBe(true);
    expect(counter.some(function hasInventory(item) { return item.key === "inventory"; })).toBe(false);
    expect(counter.some(function hasDashboard(item) { return item.key === "dashboard"; })).toBe(false);
  });

  it("sends a locked route to the first screen that role can open", () => {
    expect(lockedRouteFallback("inventory", cashier)).toBe("pos");
    expect(lockedRouteFallback("pos", cashier)).toBe(null);
    expect(lockedRouteFallback("wards", { role: "Owner", isHospital: false })).toBe(null);
    expect(visibleNavItems({ isHospital: false })[0]?.key).toBe("dashboard");
  });
});
