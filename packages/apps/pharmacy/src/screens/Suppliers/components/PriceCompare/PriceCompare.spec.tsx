import { describe, expect, it } from "vitest";
import { PriceCompare } from "./PriceCompare";

describe("PriceCompare", () => {
  it("exports the component", () => {
    expect(typeof PriceCompare).toBe("function");
  });
});
