import { describe, expect, it } from "vitest";
import type { InvProduct } from "@/utils";
import { stockPillView } from "./StockPill.utils";

const product = {
  batches: [],
  reorderLevel: 5,
  name: "Paracetamol",
  pack: "Strip of 10",
} as unknown as InvProduct;

describe("stockPillView", () => {
  it("marks a product with no units as out of stock", () => {
    expect(stockPillView(product)).toEqual({ tone: "rose", label: "Out of stock" });
  });
});
