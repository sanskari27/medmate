import { describe, expect, it } from "vitest";
import type { InventoryProduct } from "@/features/inventory";
import type { Offer } from "@/features/offers";
import {
  addProduct,
  discountAmount,
  includedGst,
  priceLine,
  searchResults,
  winningOffer,
} from "./model";

const today = new Date("2026-11-12T10:00:00+05:30");

function product(overrides: Partial<InventoryProduct> = {}): InventoryProduct {
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
    batches: [
      { batchNo: "B1", expiry: "2027-06", qty: 5, rate: "10.00", mrp: "30.00", gst: 12 },
      { batchNo: "B0", expiry: "2026-10", qty: 4, rate: "10.00", mrp: "30.00", gst: 12 },
    ],
    ...overrides,
  };
}

function offer(overrides: Partial<Offer>): Offer {
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
    ...overrides,
  };
}

describe("billing counter math", () => {
  it("searches by composition and puts an exact product id first", () => {
    const dolo = product({ productId: "med-b", name: "Dolo 650", composition: "Paracetamol" });
    const hits = searchResults([dolo, product()], "para");
    expect(hits.map((item) => item.productId)).toEqual(["med-b", "med-a"]);
    expect(searchResults([dolo, product()], "med-b")[0]?.productId).toBe("med-b");
  });

  it("increments a scanned line and caps a flat offer at MRP", () => {
    const item = product();
    const first = addProduct([], item, today);
    expect(first.lines).toEqual([
      {
        key: "line-1",
        productId: "med-a",
        batchNo: "B1",
        qty: 1,
        discountType: "none",
        discountValue: 0,
      },
    ]);
    const chosen = [{ ...first.lines[0], batchNo: "B1", qty: 1 }];
    const second = addProduct(chosen, item, today);
    expect(second.lines[0]?.qty).toBe(2);
    expect(second.error).toBeNull();
    const full = addProduct(
      [
        {
          key: "line-1",
          productId: "med-a",
          batchNo: "B1",
          qty: 5,
          discountType: "none",
          discountValue: 0,
        },
      ],
      item,
      today,
    );
    expect(full.error).toBe("Only 5 left");

    const priced = priceLine(
      [offer({ type: "flat", value: 40, title: "Too big" })],
      "med-a",
      30,
      2,
    );
    expect(priced.unitPrice).toBe(0);
    expect(priced.discount).toBe(60);
  });

  it("keeps the offer that saves the most, then the product offer, then the higher number", () => {
    const offers = [
      offer({ id: "OFR-001", type: "pct", value: 10, title: "Ten percent" }),
      offer({
        id: "OFR-002",
        type: "flat",
        value: 6,
        scope: "product",
        target: "med-a",
        title: "Six off",
      }),
    ];
    expect(winningOffer(offers, "med-a", 30)?.id).toBe("OFR-002");
    expect(priceLine(offers, "med-a", 30, 2).discount).toBe(12);

    const tied = [
      offer({ id: "OFR-010", type: "flat", value: 6, title: "Storewide" }),
      offer({
        id: "OFR-002",
        type: "flat",
        value: 6,
        scope: "product",
        target: "med-a",
        title: "This medicine",
      }),
    ];
    expect(winningOffer(tied, "med-a", 30)?.id).toBe("OFR-002");

    const newer = [
      offer({ id: "OFR-002", type: "flat", value: 6, scope: "product", target: "med-a" }),
      offer({
        id: "OFR-010",
        type: "flat",
        value: 6,
        scope: "product",
        target: "med-a",
        title: "Newer",
      }),
    ];
    expect(winningOffer(newer, "med-a", 30)?.id).toBe("OFR-010");
  });

  it("applies a percent on the line after the offer and caps a flat bill discount", () => {
    const priced = priceLine([offer({})], "med-a", 30, 1, { type: "percent", value: 10 });
    expect(priced.unitPrice).toBe(24.3);
    expect(priced.offerDiscount).toBe(3);
    expect(priced.extraDiscount).toBe(2.7);
    expect(discountAmount({ type: "flat", value: 100 }, priced.net)).toBe(24.3);
    expect(priceLine([], "med-a", 30, 1, { type: "flat", value: 40 }).unitPrice).toBe(0);
    expect(includedGst(27, 12)).toEqual({ gst: 2.89, cgst: 1.45, sgst: 1.44 });
    expect(includedGst(0, 12)).toEqual({ gst: 0, cgst: 0, sgst: 0 });
  });
});
