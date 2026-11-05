import { describe, expect, it } from "vitest";
import { daysIn } from "./Wards.utils";

describe("Wards", () => {
  it("counts at least one day in the ward", () => {
    expect(daysIn(0, 0)).toBe(1);
  });
});
