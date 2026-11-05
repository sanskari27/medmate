import { describe, expect, it } from "vitest";
import { PharmacyFile } from "./PharmacyFile";

describe("PharmacyFile", () => {
  it("exports the component", () => {
    expect(typeof PharmacyFile).toBe("function");
  });
});
