import type { PayMode } from "@/domain/selling";

// ════════════════════════════════════════════════════════════════
// Expenses — out-of-pocket business spend (rent, salaries, utilities…)
// Feeds the Expense Category / Expense Transaction reports.
// ════════════════════════════════════════════════════════════════
export const EXPENSE_CATEGORIES = [
  "Employee Salaries & Advances",
  "Rent Expense",
  "Electricity Bill",
  "Telephone & Internet Expense",
  "Printing and Stationery",
  "Repair & Maintenance",
  "Transportation & Travel",
  "Raw Material",
  "Marketing & Promotion",
  "Bank Charges",
  "Miscellaneous",
];

export type Expense = {
  id: string; // "EXP-1009"
  number: string; // shown in lists (e.g. "EXP-1009")
  date: number; // when it was incurred
  party: string; // paid to (landlord, staff, vendor…)
  category: string; // one of EXPENSE_CATEGORIES (or custom)
  paymentMode: PayMode; // how it was paid
  amount: number; // total paid (GST-inclusive)
  gst?: number; // GST % (if a tax invoice), else 0
  note?: string;
};

/** Amount before GST. The stored amount already includes GST when a rate is set. */
export const expenseTaxable = (expense: Expense) =>
  expense.gst ? expense.amount / (1 + expense.gst / 100) : expense.amount;
export const expenseTax = (expense: Expense) => expense.amount - expenseTaxable(expense);
