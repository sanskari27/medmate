import { describe, expect, it } from "vitest";
import type { InventoryProduct } from "@/features/inventory";
import type { Offer } from "@/features/offers";
import type { CartLine } from "../../model";
import { billTotals } from "./billingView";

function product(): InventoryProduct {
  return {
    productId: "med-a",
    name: "Crocin Advance",
    marketer: "GSK",
    composition: "Paracetamol",
    form: "Tablet",
    pack: "Strip",
    type: "allopathy",
    reorderLevel: 20,
    rack: null,
    rackAlt: null,
    prescriptionRequired: false,
    batches: [{ batchNo: "B1", expiry: "2027-06", qty: 5, rate: "10.00", mrp: "30.00", gst: 12 }],
  };
}

function offer(): Offer {
  return {
    id: "OFR-001",
    title: "Ten percent",
    code: "TEN",
    type: "pct",
    value: 10,
    scope: "all",
    target: null,
    active: true,
    itemCount: 1,
  };
}

const line: CartLine = {
  key: "line-1",
  productId: "med-a",
  batchNo: "B1",
  qty: 1,
  discountType: "none",
  discountValue: 0,
};

describe("billing view", () => {
  it("splits GST on a percent offer and applies a flat bill discount", () => {
    const totals = billTotals([line], [product()], [offer()], { type: "flat", value: 2 });
    expect(totals.subtotal).toBe(30);
    expect(totals.offers).toBe(3);
    expect(totals.cgst).toBe(1.45);
    expect(totals.sgst).toBe(1.44);
    expect(totals.payable).toBe(25);
  });
});
