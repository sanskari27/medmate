import { describe, expect, it } from "vitest";
import type { Sale } from "@/utils";
import { buildCustomerDirectory, creditOutreach, filterCustomers, loyaltyPoints, sortCustomers, summarizeCustomers } from "./Customers.utils";

function sale(overrides: Partial<Sale> = {}): Sale {
  return {
    id: "S-1",
    status: "completed",
    channel: "counter",
    createdAt: 1_700_000_000_000,
    customer: { name: "Anita Rao", phone: "9000000001" },
    items: [{ name: "Paracetamol", qty: 2 }],
    discount: 0,
    rx: false,
    payMode: "cash",
    ...overrides,
  } as Sale;
}

describe("buildCustomerDirectory", () => {
  it("groups named buyers and folds walk-ins into one row", () => {
    const rows = buildCustomerDirectory([
      sale(),
      sale({ id: "S-2", createdAt: 1_700_000_100_000, rx: true, channel: "online" }),
      sale({ id: "S-3", customer: { name: "Walk-in", phone: "" }, items: [{ name: "ORS", qty: 1 } as Sale["items"][number]] }),
      sale({ id: "S-4", status: "cancelled" }),
      sale({ id: "S-5", customer: { name: "Kiosk (self-order)", phone: "" } }),
    ]);
    expect(rows.map(function nameOf(row) { return row.name; }).sort()).toEqual(["Anita Rao", "Walk-in customers"]);
    const anita = rows.find(function isAnita(row) { return row.name === "Anita Rao"; });
    expect(anita?.orders).toHaveLength(2);
    expect(anita?.rx).toBe(true);
    expect(anita?.online).toBe(1);
    expect(anita?.offline).toBe(1);
  });
});

describe("customer list helpers", () => {
  const rows = buildCustomerDirectory([
    sale(),
    sale({ id: "S-2", customer: { name: "Bala", phone: "9000000002" }, createdAt: 1_800_000_000_000 }),
  ]);

  it("filters by name or phone and sorts by the selected column", () => {
    expect(filterCustomers(rows, "bala")).toHaveLength(1);
    expect(sortCustomers(rows, "recent")[0]?.name).toBe("Bala");
  });

  it("summarizes named, repeat, and chronic customers", () => {
    const summary = summarizeCustomers(rows);
    expect(summary.named).toBe(2);
    expect(summary.repeat).toBe(0);
    expect(loyaltyPoints(250)).toBe(2);
  });

  it("writes the khata reminder and the credit offer", () => {
    expect(creditOutreach("remind", "Anita", "Green Cross", 120)).toContain("Anita");
    expect(creditOutreach("invite", "Anita", "Green Cross", 0)).toContain("pay later");
  });
});
