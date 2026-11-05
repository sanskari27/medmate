import { describe, expect, it } from "vitest";
import { kioskProducts, nextPayModes } from "./Kiosk.utils";

describe("kiosk catalog", () => {
  it("toggles a pay mode without dropping the others", () => {
    expect(nextPayModes(["cash"], "upi")).toEqual(["cash", "upi"]);
    expect(nextPayModes(["cash", "upi"], "upi")).toEqual(["cash"]);
  });

  it("lists only in-stock products for the chosen category", () => {
    const products = [
      { online: true, category: "otc", stock: 2 },
      { online: true, category: "rx", stock: 0 },
      { online: false, category: "otc", stock: 4 },
    ];
    expect(kioskProducts(products, "otc", function units(product) { return product.stock; })).toEqual([products[0]]);
  });
});
