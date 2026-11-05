import { describe, expect, it } from "vitest";
import { catalogProducts } from "./OnlineStore.utils";

describe("catalogProducts", () => {
  it("filters by category and a case-insensitive name", () => {
    const products = [
      { category: "otc", name: "Paracetamol" },
      { category: "rx", name: "Para IV" },
    ];
    expect(catalogProducts(products, "otc", "para")).toEqual([products[0]]);
  });
});
