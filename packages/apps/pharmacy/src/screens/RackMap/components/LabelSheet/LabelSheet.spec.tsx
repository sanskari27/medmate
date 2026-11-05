import { describe, expect, it } from "vitest";
import { LabelSheet } from "./LabelSheet";

describe("LabelSheet", () => {
  it("exports the component", () => {
    expect(typeof LabelSheet).toBe("function");
  });
});
