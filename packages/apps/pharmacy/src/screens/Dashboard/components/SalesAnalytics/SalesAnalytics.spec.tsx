import { describe, expect, it } from "vitest";
import { SalesAnalytics } from "./SalesAnalytics";

describe("SalesAnalytics", () => {
  it("exports the component", () => {
    expect(typeof SalesAnalytics).toBe("function");
  });
});
