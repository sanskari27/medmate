import { describe, expect, it } from "vitest";
import { makeCode } from "./Master.utils";

describe("Master", () => {
  it("builds an eight-character pharmacy code", () => {
    expect(makeCode()).toMatch(/^[A-Z2-9]{8}$/);
  });
});
