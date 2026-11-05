import { describe, expect, it } from "vitest";
import { TrendChart } from "./TrendChart";

describe("TrendChart", () => {
  it("exports the component", () => {
    expect(typeof TrendChart).toBe("function");
  });
});
