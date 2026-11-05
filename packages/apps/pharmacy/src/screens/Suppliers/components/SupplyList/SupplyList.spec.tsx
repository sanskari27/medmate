import { describe, expect, it } from "vitest";
import { SupplyList } from "./SupplyList";

describe("SupplyList", () => {
  it("exports the component", () => {
    expect(typeof SupplyList).toBe("function");
  });
});
