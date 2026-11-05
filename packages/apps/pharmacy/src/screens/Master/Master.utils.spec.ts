import { describe, expect, it } from "vitest";
import { kycGaps, makeCode, seatText } from "./Master.utils";

describe("kycGaps", () => {
  it("lists the missing licence fields", () => {
    expect(kycGaps({ kyc: { gstin: "", pan: "ABCDE1234F", dlNo: "", fssai: "" } })).toEqual(["GSTIN", "Drug licence"]);
  });
});

describe("seatText", () => {
  it("describes included seats", () => {
    expect(seatText({ included: null, extra: 2, inUse: 4, limit: null })).toBe("4 in use · unlimited included · 2 extra");
  });
});

describe("makeCode", () => {
  it("builds an eight character code", () => {
    expect(makeCode()).toHaveLength(8);
  });
});
