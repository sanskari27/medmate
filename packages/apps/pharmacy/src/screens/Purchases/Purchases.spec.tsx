import { describe, expect, it } from "vitest";
import type { SupplyEntry } from "@/utils";
import { multiSourceCount } from "./Purchases.utils";

describe("Purchases", () => {
  it("counts products that have more than one supply row", () => {
    const rows = [{ productId: "a" }, { productId: "a" }, { productId: "b" }] as SupplyEntry[];
    expect(multiSourceCount(rows)).toBe(1);
  });
});
