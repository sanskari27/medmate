import { describe, expect, it } from "vitest";
import { expenseDate } from "./Expenses.utils";

describe("Expenses", () => {
  it("formats an expense timestamp as a calendar day", () => {
    expect(expenseDate(new Date(2026, 0, 5).getTime())).toBe("2026-01-05");
  });
});
