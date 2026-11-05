import { describe, expect, it } from "vitest";
import { BankCard } from "./BankCard";

describe("BankCard", () => {
  it("exports the component", () => {
    expect(typeof BankCard).toBe("function");
  });
});
