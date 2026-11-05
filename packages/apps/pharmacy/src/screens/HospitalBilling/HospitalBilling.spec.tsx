import { describe, expect, it } from "vitest";
import { norm } from "./HospitalBilling.utils";

describe("HospitalBilling", () => {
  it("folds a ward name down to letters and digits", () => {
    expect(norm("ICU-1 A")).toBe("icu1a");
  });
});
