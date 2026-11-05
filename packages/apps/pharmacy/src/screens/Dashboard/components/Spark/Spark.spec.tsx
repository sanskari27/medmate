import { describe, expect, it } from "vitest";
import { Spark } from "./Spark";

describe("Spark", () => {
  it("exports the component", () => {
    expect(typeof Spark).toBe("function");
  });
});
