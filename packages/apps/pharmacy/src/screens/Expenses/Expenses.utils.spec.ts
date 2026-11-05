import { describe, expect, it } from "vitest";
import { expenseDate } from "./Expenses.utils";

describe("expenseDate", () => {
  it("formats a local date as YYYY-MM-DD", () => {
    const stamp = new Date(2026, 0, 7).getTime();
    expect(expenseDate(stamp)).toBe("2026-01-07");
  });
});
