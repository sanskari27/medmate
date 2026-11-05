import { describe, expect, it } from "vitest";
import { daysIn } from "./Wards.utils";

describe("daysIn", () => {
  it("counts at least one day and rounds partial days up", () => {
    expect(daysIn(0, 1)).toBe(1);
    expect(daysIn(0, 86400000 * 2)).toBe(2);
  });
});
