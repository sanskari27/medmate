import { describe, expect, it } from "vitest";
import { HBar } from "./HBar";

describe("HBar", () => {
  it("exports the component", () => {
    expect(typeof HBar).toBe("function");
  });
});
