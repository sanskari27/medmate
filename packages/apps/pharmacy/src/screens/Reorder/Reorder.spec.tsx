import { describe, expect, it } from "vitest";
import { lowStockProducts } from "./Reorder.utils";

describe("lowStockProducts", () => {
  it("keeps products the stock check marks as low", () => {
    const products = [{ id: "a", low: true }, { id: "b", low: false }];
    expect(lowStockProducts(products, function isLow(product) { return product.low; })).toEqual([products[0]]);
  });
});
