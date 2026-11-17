import { describe, expect, it } from "vitest";
import { latestOtpCode, mockPhone } from "./otpMessage";

describe("mockPhone", () => {
  it("prefixes a 10-digit mobile the way Bruno does", () => {
    expect(mockPhone("98765 43210")).toBe("+919876543210");
  });

  it("keeps a 12-digit 91 number as E.164", () => {
    expect(mockPhone("919876543210")).toBe("+919876543210");
  });
});

describe("latestOtpCode", () => {
  it("returns the latest code for the phone", () => {
    const code = latestOtpCode(
      [
        { phone: "+919876543210", code: "111111" },
        { phone: "+919999999999", code: "222222" },
        { phone: "+919876543210", code: "333333" },
      ],
      "9876543210",
    );
    expect(code).toBe("333333");
  });

  it("returns null when the mock has no matching code", () => {
    expect(latestOtpCode([{ phone: "+919876543210" }], "9876543210")).toBeNull();
  });
});
