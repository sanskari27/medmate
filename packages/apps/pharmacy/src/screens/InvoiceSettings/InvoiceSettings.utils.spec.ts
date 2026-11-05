import { describe, expect, it } from "vitest";
import { thermalPreviewClass } from "./InvoiceSettings.utils";

describe("thermalPreviewClass", () => {
  it("narrows the preview only for the thermal template", () => {
    expect(thermalPreviewClass("thermal")).toContain("max-w-[320px]");
    expect(thermalPreviewClass("classic")).toBe("");
  });
});
