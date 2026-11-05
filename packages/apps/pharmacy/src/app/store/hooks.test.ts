import { describe, expect, it } from "vitest";
import { resolveSetState } from "./hooks";

describe("resolveSetState", () => {
  it("applies a value or a function update", () => {
    expect(resolveSetState(1, 2)).toBe(2);
    expect(resolveSetState(1, (value) => value + 3)).toBe(4);
  });
});
