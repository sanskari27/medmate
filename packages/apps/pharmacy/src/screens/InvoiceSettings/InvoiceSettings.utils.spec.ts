import { describe, expect, it } from "vitest";
import { thermalPreviewClass } from "./InvoiceSettings.utils";

describe("thermalPreviewClass", () => {
  it("uses the ruled thermal paper only for the thermal template", () => {
    expect(thermalPreviewClass("thermal")).toContain("repeating-linear-gradient");
    expect(thermalPreviewClass("classic")).toBe("");
  });
});
