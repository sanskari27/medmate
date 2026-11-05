import { describe, expect, it } from "vitest";
import type { Sale } from "@/utils";
import {
  doctorLabel,
  filterRegister,
  registerTotals,
  salePayable,
  sourceTone,
} from "./SalesRegister.utils";

const sale = {
  id: "INV-9",
  channel: "offline",
  status: "completed",
  source: "ward",
  customer: { name: "Asha", doctor: "Dr. Rao" },
  items: [{ qty: 1, price: 80, mrp: 80, gst: 5 }],
  discount: 0,
  payMode: "cash",
  paid: false,
  ward: "ICU",
  createdAt: 20,
} as Sale;

describe("filterRegister", () => {
  it("keeps an unpaid ward sale that matches the patient", () => {
    const rows = filterRegister([sale], {
      source: "ward",
      payMode: "all",
      paid: "unpaid",
      insurer: "all",
      ward: "ICU",
      searchQuery: "asha",
    });
    expect(rows).toEqual([sale]);
    expect(salePayable(sale)).toBe(80);
    expect(registerTotals(rows).unpaid).toBe(80);
  });
});

describe("sourceTone", () => {
  it("maps a ward sale to gold", () => {
    expect(sourceTone("ward")).toBe("gold");
    expect(doctorLabel("Dr. Rao")).toBe("Rao");
  });
});
