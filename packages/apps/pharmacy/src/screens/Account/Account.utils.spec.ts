import { describe, expect, it } from "vitest";
import { bankForm } from "./Account.utils";

describe("bankForm", () => {
  it("starts from a blank current account when none is saved", () => {
    expect(bankForm(null)).toEqual({
      holderName: "",
      accountNumber: "",
      ifsc: "",
      bankName: "",
      branch: "",
      accountType: "Current",
      upiVpa: "",
    });
  });
});
