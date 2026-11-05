import { describe, expect, it } from "vitest";
import { ReferralTable } from "./ReferralTable";

describe("ReferralTable", () => {
  it("exports the component", () => {
    expect(typeof ReferralTable).toBe("function");
  });
});
