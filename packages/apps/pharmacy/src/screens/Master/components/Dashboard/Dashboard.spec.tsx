import { describe, expect, it } from "vitest";
import { Dashboard } from "./Dashboard";

describe("Dashboard", () => {
  it("exports the component", () => {
    expect(typeof Dashboard).toBe("function");
  });
});
