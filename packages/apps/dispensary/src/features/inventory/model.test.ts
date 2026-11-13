import { describe, expect, it } from "vitest";
import { isLow, isOut, tableComposition, type InventoryProduct } from "./model";

function product(batches: InventoryProduct["batches"], reorderLevel = 20): InventoryProduct {
  return {
    productId: "P",
    name: "Name",
    marketer: null,
    composition: null,
    form: null,
    pack: null,
    type: null,
    reorderLevel,
    rack: null,
    rackAlt: null,
    batches,
  };
}

describe("inventory stock rules", () => {
  it("marks stock at or under the reorder level as low", () => {
    expect(
      isLow(
        product([{ batchNo: "B", expiry: "2027-03", qty: 50, rate: "10.00", mrp: "12.00" }], 5),
      ),
    ).toBe(false);
    expect(
      isLow(product([{ batchNo: "B", expiry: "2027-03", qty: 4, rate: "300.00", mrp: "400.00" }])),
    ).toBe(true);
    expect(
      isLow(product([{ batchNo: "B", expiry: "2027-03", qty: 1, rate: "999.49", mrp: "1.00" }])),
    ).toBe(true);
    expect(
      isLow(product([{ batchNo: "B", expiry: "2027-03", qty: 20, rate: "999.50", mrp: "1.00" }])),
    ).toBe(true);
    expect(
      isLow(product([{ batchNo: "B", expiry: "2027-03", qty: 21, rate: "1.00", mrp: "1.00" }])),
    ).toBe(false);
  });

  it("keeps a zero quantity out of the low-stock rule", () => {
    const empty = product([]);
    expect(isOut(empty)).toBe(true);
    expect(isLow(empty)).toBe(false);
  });

  it("cuts composition at 50 characters", () => {
    const full = "Paracetamol 500 mg, Phenylephrine hydrochloride 10 mg, extra";
    expect(full.length).toBeGreaterThan(50);
    expect(tableComposition(full)).toBe(full.slice(0, 50));
    expect(tableComposition(full)?.endsWith("…")).toBe(false);
    expect(tableComposition("Paracetamol 500 mg")).toBe("Paracetamol 500 mg");
    expect(tableComposition(null)).toBeNull();
  });
});
