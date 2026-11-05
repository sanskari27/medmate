import { describe, expect, it } from "vitest";
import { exGst } from "./Reports.utils";

describe("Reports", () => {
  it("backs GST out of an inclusive line", () => {
    expect(exGst(118, 1, 18)).toBeCloseTo(100);
  });
});
