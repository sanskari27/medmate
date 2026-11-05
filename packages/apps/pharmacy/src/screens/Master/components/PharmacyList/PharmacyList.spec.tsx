import { describe, expect, it } from "vitest";
import { PharmacyList } from "./PharmacyList";

describe("PharmacyList", () => {
  it("exports the component", () => {
    expect(typeof PharmacyList).toBe("function");
  });
});
