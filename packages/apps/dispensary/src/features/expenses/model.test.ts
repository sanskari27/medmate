import { describe, expect, it } from "vitest";
import {
  canCreateExpense,
  canOpenExpenses,
  expenseCsv,
  expensePdf,
  expenseRange,
  expenseTax,
  type ExpenseRow,
} from "./model";

const row: ExpenseRow = {
  number: "EXP-1001",
  spentOn: "2026-01-15",
  party: "Landlord",
  category: "Rent Expense",
  paymentMode: "cash",
  amount: "118.00",
  gst: 18,
  note: null,
};

describe("expense access", () => {
  it("lets the owner and a reader open the page", () => {
    expect(canOpenExpenses("owner", [])).toBe(true);
    expect(canOpenExpenses("staff", ["expenses:read"])).toBe(true);
    expect(canOpenExpenses("staff", ["expenses:create"])).toBe(false);
  });

  it("lets the owner and a creator open the dialog", () => {
    expect(canCreateExpense("owner", [])).toBe(true);
    expect(canCreateExpense("staff", ["expenses:create"])).toBe(true);
    expect(canCreateExpense("staff", ["expenses:read"])).toBe(false);
  });
});

describe("expense range", () => {
  it("uses the last 365 Asia/Kolkata dates by default", () => {
    const range = expenseRange("last-365", "2026-11-13");
    expect(range.label).toBe("Last 365 Days");
    expect(range.to).toBe("2026-11-13");
    expect(range.from).toBe("2025-11-14");
  });

  it("starts the week on Monday and the fiscal year on 1 April", () => {
    expect(expenseRange("this-week", "2026-11-13")).toEqual({
      from: "2026-11-09",
      to: "2026-11-15",
      label: "This Week",
    });
    expect(expenseRange("this-fy", "2026-11-13")).toEqual({
      from: "2026-04-01",
      to: "2027-03-31",
      label: "Current Fiscal Year",
    });
    expect(expenseRange("this-quarter", "2026-11-13").from).toBe("2026-10-01");
  });
});

describe("expense register", () => {
  it("splits inclusive GST and totals the download", () => {
    expect(expenseTax("118.00", 18)).toEqual({ taxable: "100.00", tax: "18.00" });
    expect(expenseCsv([row])).toContain("TOTAL,,,,,118.00");
    expect(expensePdf([row]).startsWith("%PDF-1.4")).toBe(true);
    expect(expensePdf([row])).toContain("TOTAL");
  });
});
