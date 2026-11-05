import { describe, expect, it } from "vitest";
import type { InvProduct } from "@/utils";
import { filterInventoryProducts, inventorySnapshot, productDraftReady } from "./Inventory.utils";

const product = {
  id: "1",
  name: "Paracetamol",
  composition: "Acetaminophen",
  manufacturer: "Acme",
  schedule: "OTC",
  batches: [],
} as unknown as InvProduct;

describe("inventorySnapshot", () => {
  it("counts the catalogue", () => {
    expect(inventorySnapshot([product], [], Date.now()).totalSkus).toBe(1);
  });
});

describe("productDraftReady", () => {
  it("requires a name", () => {
    expect(productDraftReady("  ")).toBe(false);
    expect(productDraftReady("Dolo")).toBe(true);
  });
});

describe("filterInventoryProducts", () => {
  it("drops a product whose name does not match the query", () => {
    expect(filterInventoryProducts([product], "all", "ibuprofen", Date.now())).toEqual([]);
    expect(filterInventoryProducts([product], "all", "para", Date.now())).toEqual([product]);
  });
});
