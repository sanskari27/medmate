import { describe, expect, it } from "vitest";
import { earnedReferralTotal } from "./Referrals.utils";

describe("earnedReferralTotal", () => {
  it("sums earned and paid rewards only", () => {
    expect(earnedReferralTotal([
      { status: "Earned", reward: 500 },
      { status: "Pending", reward: 500 },
      { status: "Paid", reward: 200 },
    ])).toBe(700);
  });
});
