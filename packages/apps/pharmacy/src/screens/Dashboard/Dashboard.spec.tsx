import { describe, expect, it } from "vitest";
import { inrK } from "./Dashboard.utils";

describe("Dashboard", () => {
  it("shortens thousands of rupees", () => {
    expect(inrK(2500)).toBe("₹3k");
  });
});
