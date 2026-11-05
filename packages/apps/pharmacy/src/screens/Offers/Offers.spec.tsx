import { describe, expect, it } from "vitest";
import { productsInOffer } from "./Offers.utils";

describe("productsInOffer", () => {
  it("counts products in the offer category", () => {
    const products = [
      { id: "a", category: "otc" },
      { id: "b", category: "rx" },
    ];
    expect(productsInOffer(products, { scope: "category", target: "otc" })).toBe(1);
  });
});
