import { describe, expect, it } from "vitest";
import type { InventoryProduct } from "@/features/inventory";
import { auditCsv, composeRack, groupByLocation, unassignedProducts } from "./model";

function product(
  patch: Partial<InventoryProduct> & Pick<InventoryProduct, "productId" | "name">,
): InventoryProduct {
  return {
    marketer: null,
    composition: null,
    form: null,
    pack: null,
    type: null,
    reorderLevel: 20,
    rack: null,
    rackAlt: null,
    batches: [],
    ...patch,
  };
}

describe("rack placement", () => {
  it("composes a rack, shelf, and bin", () => {
    expect(composeRack("a", "3", "12")).toBe("A3-12");
    expect(composeRack("A", "", "")).toBe("A");
    expect(composeRack("  ", "1", "2")).toBe("");
  });

  it("groups empty registry racks and lists products with no primary code", () => {
    const placed = product({ productId: "DR100", name: "Crocin", rack: "A1" });
    const loose = product({ productId: "DR80", name: "Drops" });
    expect(groupByLocation([placed, loose], ["B2", "A1"]).map((group) => group.code)).toEqual([
      "A1",
      "B2",
    ]);
    expect(groupByLocation([placed, loose], ["B2"])[0]?.items).toEqual([placed]);
    expect(unassignedProducts([placed, loose])).toEqual([loose]);
  });

  it("writes one audit row per batch and marks an empty primary code", () => {
    const csv = auditCsv(
      [
        product({
          productId: "DR100",
          name: "Crocin",
          rack: "b1",
          rackAlt: "c2",
          composition: "Paracetamol",
          batches: [{ batchNo: "B1", expiry: "2027-03", qty: 2, rate: "10.00", mrp: "18.00" }],
        }),
        product({ productId: "DR0", name: "Loose" }),
      ],
      new Date("2026-11-12T08:00:00+05:30"),
    );
    expect(csv.split("\n")[0]).toContain("Rack");
    expect(csv).toContain('"B1","C2","Crocin"');
    expect(csv).toContain('"Expiring (4mo)"');
    expect(csv).toContain('"UNASSIGNED","","Loose"');
  });
});
