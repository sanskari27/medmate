import { describe, expect, it } from "vitest";
import { norm } from "./HospitalBilling.utils";

describe("norm", () => {
  it("keeps letters and digits in lowercase", () => {
    expect(norm("Para-500 mg")).toBe("para500mg");
  });
});
