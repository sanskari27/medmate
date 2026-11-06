import { describe, expect, it } from "vitest";
import { faultMessage } from "@/store/faultMessage";

describe("faultMessage", () => {
  it("uses an error message or the fallback", () => {
    expect(faultMessage(new Error("Missing GSTIN"), "Save failed")).toBe("Missing GSTIN");
    expect(faultMessage("Save cancelled", "Save failed")).toBe("Save cancelled");
    expect(faultMessage(null, "Save failed")).toBe("Save failed");
  });
});
