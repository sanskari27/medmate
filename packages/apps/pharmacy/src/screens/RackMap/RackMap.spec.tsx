import { describe, expect, it } from "vitest";
import { unassignedProducts } from "./RackMap.utils";

describe("unassignedProducts", () => {
  it("keeps products that have no rack location", () => {
    const products = [{ id: "a" }, { id: "b" }];
    expect(unassignedProducts(products, function placed(product) { return product.id === "a"; })).toEqual([{ id: "b" }]);
  });
});
