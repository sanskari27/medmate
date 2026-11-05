import { describe, expect, it } from "vitest";
import { DonutChart } from "./DonutChart";

describe("DonutChart", () => {
  it("exports the component", () => {
    expect(typeof DonutChart).toBe("function");
  });
});
