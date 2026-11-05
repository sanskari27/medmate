import { describe, expect, it } from "vitest";
import type { SupplyEntry } from "@/utils";
import { multiSourceCount } from "./Purchases.utils";

describe("multiSourceCount", () => {
  it("counts products that appear on more than one supply entry", () => {
    const entries = [
      { productId: "a" },
      { productId: "a" },
      { productId: "b" },
    ] as SupplyEntry[];
    expect(multiSourceCount(entries)).toBe(1);
  });
});
