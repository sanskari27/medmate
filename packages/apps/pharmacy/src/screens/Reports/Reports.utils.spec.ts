import { describe, expect, it } from "vitest";
import { timestampInRange } from "@/utils/date";
import { exGst, r0 } from "./Reports.utils";

describe("exGst", () => {
  it("backs GST out of an inclusive line", () => {
    expect(exGst(118, 1, 18)).toBeCloseTo(100);
  });
});

describe("timestampInRange", () => {
  it("includes both ends of the window", () => {
    expect(timestampInRange(5, { from: 5, to: 8 })).toBe(true);
    expect(timestampInRange(4, { from: 5, to: 8 })).toBe(false);
  });
});

describe("r0", () => {
  it("rounds to the nearest rupee", () => {
    expect(r0(1.6)).toBe(2);
  });
});
