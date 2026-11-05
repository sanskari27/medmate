import { describe, expect, it } from "vitest";
import { AccountTab } from "./AccountTab";

describe("AccountTab", () => {
  it("exports the component", () => {
    expect(typeof AccountTab).toBe("function");
  });
});
