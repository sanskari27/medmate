import { describe, expect, it } from "vitest";
import { Overview } from "./Overview";

describe("Overview", () => {
  it("exports the component", () => {
    expect(typeof Overview).toBe("function");
  });
});
