import { describe, expect, it } from "vitest";
import { Directory } from "./Directory";

describe("Directory", () => {
  it("exports the component", () => {
    expect(typeof Directory).toBe("function");
  });
});
