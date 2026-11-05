import { describe, expect, it } from "vitest";
import { nextBusinessTypes } from "./Settings.utils";

describe("nextBusinessTypes", () => {
  it("toggles a business type", () => {
    expect(nextBusinessTypes(["pharmacy"], "hospital")).toEqual(["pharmacy", "hospital"]);
    expect(nextBusinessTypes(["pharmacy", "hospital"], "hospital")).toEqual(["pharmacy"]);
  });
});
