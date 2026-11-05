import { describe, expect, it } from "vitest";
import { bankForm } from "./Account.utils";

describe("Account", () => {
  it("starts a blank bank form when none is saved", () => {
    expect(bankForm(null).accountType).toBe("Current");
  });
});
