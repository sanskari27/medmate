import { describe, expect, it } from "vitest";
import type { Sale } from "@/utils";
import { billTotal } from "./PatientBills.utils";

describe("billTotal", () => {
  it("returns the rounded payable for the bill", () => {
    const sale = { items: [{ qty: 2, mrp: 50, price: 40, gst: 0 }], discount: 0 } as Sale;
    expect(billTotal(sale)).toBe(80);
  });
});
