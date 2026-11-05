import { describe, expect, it } from "vitest";
import { fromPaise, toPaise } from "@/utils/currency";

describe("paise", () => {
  it("converts rupee money fields to integer paise and back", () => {
    const rupees = { price: 12.5, name: "tablet", nested: { fee: 1 } };

    expect(toPaise(rupees)).toEqual({ price: 1250, name: "tablet", nested: { fee: 100 } });
    expect(fromPaise(toPaise(rupees))).toEqual(rupees);
  });
});
