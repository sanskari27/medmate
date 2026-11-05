import { inr } from "@/utils/formatting";
import { computeInvoice } from "@/utils/calculations/invoice";
import { PAY_LABEL, type PayMode, type Sale } from "@/utils/calculations/selling";

// ════════════════════════════════════════════════════════════════
// Customer credit (khata / udhaar) — bills taken on credit are debits,
// repayments are credits; outstanding = debits − repayments per customer.
// ════════════════════════════════════════════════════════════════
/** Same person on a bill and a repayment: phone when we have one, otherwise the name. */
export const custKeyOf = (customer: { name: string; phone?: string }) =>
  (customer.phone || customer.name || "").trim();

export type CreditPayment = {
  id: string; // "CR-1001"
  custKey: string; // phone || name (matches a customer)
  custName: string;
  custPhone: string;
  amount: number; // ₹ repaid
  mode: PayMode; // how the repayment was collected (cash/upi/card)
  at: number;
  note?: string;
};

/** Credit bills for one customer. Cancelled bills are ignored. */
export const creditSalesOf = (customerKey: string, sales: Sale[]) =>
  sales.filter(
    (sale) =>
      sale.status !== "cancelled" &&
      sale.payMode === "credit" &&
      custKeyOf(sale.customer) === customerKey,
  );

const billPayable = (sale: Sale) => computeInvoice(sale.items, sale.discount).payable;

/** Billed, repaid, and what is still owed. Outstanding never goes below zero. */
export const customerCredit = (customerKey: string, sales: Sale[], payments: CreditPayment[]) => {
  const billed = creditSalesOf(customerKey, sales).reduce(
    (sum, sale) => sum + billPayable(sale),
    0,
  );
  const repaid = payments
    .filter((payment) => payment.custKey === customerKey)
    .reduce((sum, payment) => sum + payment.amount, 0);
  return { given: billed, repaid, outstanding: Math.max(0, billed - repaid) };
};

/** What every customer still owes, as one number. */
export const totalCreditOutstanding = (sales: Sale[], payments: CreditPayment[]) => {
  const billed = sales
    .filter((sale) => sale.status !== "cancelled" && sale.payMode === "credit")
    .reduce((sum, sale) => sum + billPayable(sale), 0);
  const repaid = payments.reduce((sum, payment) => sum + payment.amount, 0);
  return Math.max(0, billed - repaid);
};

// One line on a customer's khata. A bill is a debit; a repayment is a credit.
export type LedgerRow = {
  at: number;
  kind: "debit" | "credit";
  label: string;
  amount: number;
  ref: string;
};
export const customerLedger = (
  customerKey: string,
  sales: Sale[],
  payments: CreditPayment[],
): LedgerRow[] => {
  const rows: LedgerRow[] = [];
  for (const sale of creditSalesOf(customerKey, sales)) {
    const itemCount = sale.items.length;
    rows.push({
      at: sale.createdAt,
      kind: "debit",
      label: `Credit bill · ${itemCount} item${itemCount === 1 ? "" : "s"}`,
      amount: billPayable(sale),
      ref: sale.id,
    });
  }
  for (const payment of payments.filter((row) => row.custKey === customerKey)) {
    const note = payment.note ? " · " + payment.note : "";
    rows.push({
      at: payment.at,
      kind: "credit",
      label: `Repayment · ${PAY_LABEL[payment.mode]}${note}`,
      amount: payment.amount,
      ref: payment.id,
    });
  }
  return rows.sort((left, right) => right.at - left.at);
};

// ── credit (khata) customers — everyone with a credit bill or repayment ──
export type CreditCustomer = {
  key: string;
  name: string;
  phone: string;
  given: number;
  repaid: number;
  outstanding: number;
  lastAt: number;
  bills: number;
};
export function creditCustomers(sales: Sale[], payments: CreditPayment[]): CreditCustomer[] {
  const customerKeys = new Set<string>();
  for (const sale of sales) {
    if (sale.status !== "cancelled" && sale.payMode === "credit")
      customerKeys.add(custKeyOf(sale.customer));
  }
  for (const payment of payments) customerKeys.add(payment.custKey);

  const rows: CreditCustomer[] = [];
  for (const key of customerKeys) {
    if (!key) continue;
    const bills = creditSalesOf(key, sales);
    const repayments = payments.filter((payment) => payment.custKey === key);
    const name = bills[0]?.customer.name || repayments[0]?.custName || key;
    const phone =
      bills.find((sale) => sale.customer.phone)?.customer.phone ||
      repayments.find((payment) => payment.custPhone)?.custPhone ||
      "";
    const position = customerCredit(key, sales, payments);
    const lastAt = Math.max(
      0,
      ...bills.map((sale) => sale.createdAt),
      ...repayments.map((payment) => payment.at),
    );
    rows.push({
      key,
      name,
      phone,
      lastAt,
      given: position.given,
      repaid: position.repaid,
      outstanding: position.outstanding,
      bills: bills.length,
    });
  }
  return rows.sort(
    (left, right) => right.outstanding - left.outstanding || right.lastAt - left.lastAt,
  );
}

// ── credit aging (FIFO: repayments clear the oldest bills first) ──
export type UnpaidBill = {
  id: string;
  at: number;
  amount: number;
  remaining: number;
  items: number;
};
export type CreditAging = {
  oldestUnpaidAt: number;
  ageDays: number;
  overdue: boolean;
  unpaidBills: UnpaidBill[];
};
export const creditAging = (
  customerKey: string,
  sales: Sale[],
  payments: CreditPayment[],
  now: number,
): CreditAging => {
  const billsOldestFirst = creditSalesOf(customerKey, sales)
    .map((sale) => ({
      id: sale.id,
      at: sale.createdAt,
      amount: billPayable(sale),
      items: sale.items.length,
    }))
    .sort((left, right) => left.at - right.at);

  // One repayment pool. It clears the oldest bill completely before the next.
  let repaymentLeft = payments
    .filter((payment) => payment.custKey === customerKey)
    .reduce((sum, payment) => sum + payment.amount, 0);

  const unpaidBills: UnpaidBill[] = [];
  let oldestUnpaidAt = 0;
  for (const bill of billsOldestFirst) {
    const remaining = Math.max(0, bill.amount - repaymentLeft);
    repaymentLeft = Math.max(0, repaymentLeft - bill.amount);
    if (remaining <= 0) continue;
    if (!oldestUnpaidAt) oldestUnpaidAt = bill.at;
    unpaidBills.push({
      id: bill.id,
      at: bill.at,
      amount: bill.amount,
      remaining,
      items: bill.items,
    });
  }

  const millisecondsPerDay = 86400000;
  const ageDays = oldestUnpaidAt ? Math.floor((now - oldestUnpaidAt) / millisecondsPerDay) : 0;
  return { oldestUnpaidAt, ageDays, overdue: ageDays > 30, unpaidBills };
};
// How old the money is. `key` is read by the Khata screen ("cur", "d60", "d60p").
export type CreditBucket = {
  key: string;
  label: string;
  min: number;
  max: number;
  amount: number;
  count: number;
};
export const creditAgingBuckets = (
  customers: CreditCustomer[],
  sales: Sale[],
  payments: CreditPayment[],
  now: number,
): CreditBucket[] => {
  const buckets: CreditBucket[] = [
    { key: "cur", label: "0–30 days", min: 0, max: 30, amount: 0, count: 0 },
    { key: "d60", label: "31–60 days", min: 31, max: 60, amount: 0, count: 0 },
    { key: "d60p", label: "60+ days", min: 61, max: Infinity, amount: 0, count: 0 },
  ];
  for (const customer of customers) {
    if (customer.outstanding <= 0) continue;
    const ageDays = creditAging(customer.key, sales, payments, now).ageDays;
    const bucket =
      buckets.find((row) => ageDays >= row.min && ageDays <= row.max) ??
      buckets[buckets.length - 1];
    bucket.amount += customer.outstanding;
    bucket.count += 1;
  }
  return buckets;
};

// a payment-collection WhatsApp message body (used by the Khata screens)
export const collectMsg = (name: string, pharmacy: string, outstanding: number, payTo?: string) =>
  `Hi ${name}, this is ${pharmacy}. 🧾 Your pending medicine credit (khata) balance is ${inr(outstanding)}.` +
  ` Kindly clear it at your convenience${payTo ? ` — you can pay via UPI to ${payTo}` : ""}. Thank you! 🙏`;
