import { describe, expect, it } from "vitest";
import { clampPercent, cn, joinClassNames } from "./className.utils";

describe("cn", () => {
  it("drops empty parts and lets a later Tailwind class win", () => {
    expect(cn("flex", false, null, undefined, "", "gap-2", "px-2", "px-4")).toBe("flex gap-2 px-4");
  });
});

describe("joinClassNames", () => {
  it("drops empty parts and joins the rest", () => {
    expect(joinClassNames("flex", false, null, undefined, "", "gap-2")).toBe("flex gap-2");
  });
});

describe("clampPercent", () => {
  it("keeps a percent inside 0 to 100", () => {
    expect(clampPercent(-4)).toBe(0);
    expect(clampPercent(40)).toBe(40);
    expect(clampPercent(140)).toBe(100);
    expect(clampPercent(Number.NaN)).toBe(0);
  });
});
