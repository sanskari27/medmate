import { describe, expect, it } from "vitest";
import { Ring } from "./Ring";

describe("Ring", () => {
  it("exports the component", () => {
    expect(typeof Ring).toBe("function");
  });
});
