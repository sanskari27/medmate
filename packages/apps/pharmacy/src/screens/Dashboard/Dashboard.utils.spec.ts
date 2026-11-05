import { describe, expect, it } from "vitest";
import { inrK } from "./Dashboard.utils";

describe("inrK", () => {
  it("shortens thousands, lakhs, and crores", () => {
    expect(inrK(999)).toBe("₹999");
    expect(inrK(1500)).toBe("₹2k");
    expect(inrK(100000)).toBe("₹1.0L");
    expect(inrK(10000000)).toBe("₹1.0Cr");
  });
});
