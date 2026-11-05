import { describe, expect, it } from "vitest";
import { AnalyticsDashboard } from "./AnalyticsDashboard";

describe("AnalyticsDashboard", () => {
  it("exports the component", () => {
    expect(typeof AnalyticsDashboard).toBe("function");
  });
});
