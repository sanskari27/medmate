export const PAYMENT_TERMS = [
  "Advance",
  "On delivery",
  "7 days credit",
  "15 days credit",
  "30 days credit",
  "45 days credit",
] as const;

export const PAYMENT_MODES = [
  { value: "cash", label: "Cash" },
  { value: "upi", label: "UPI" },
  { value: "card", label: "Card" },
  { value: "bank_transfer", label: "Bank transfer" },
] as const;

const GSTIN = /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z][1-9A-Z]Z[0-9A-Z]$/;

export type PaymentMode = (typeof PAYMENT_MODES)[number]["value"];
export type TransactionType = "purchase" | "payment" | "return";

export type DistributorTransaction = {
  id: string;
  type: TransactionType;
  amount: number;
  reference: string | null;
  note: string | null;
  mode: PaymentMode | null;
  recordedAt: string;
};

export type Distributor = {
  id: string;
  name: string;
  contactPerson: string | null;
  phone: string;
  email: string | null;
  gstin: string | null;
  drugLicenceNumber: string | null;
  address: string | null;
  city: string | null;
  state: string | null;
  paymentTerms: string;
  openingBalance: number;
  outstanding: number;
  active: boolean;
  showInPurchases: boolean;
  transactions: DistributorTransaction[];
};

export type DistributorList = { distributors: Distributor[] };
export type DistributorOne = { distributor: Distributor };

export type DistributorDraft = {
  name: string;
  contactPerson: string;
  phone: string;
  email: string;
  gstin: string;
  drugLicenceNumber: string;
  address: string;
  city: string;
  state: string;
  paymentTerms: string;
  openingBalance: string;
  active: boolean;
  showInPurchases: boolean;
};

export type DistributorPayload = {
  name: string;
  contactPerson: string | null;
  phone: string;
  email: string | null;
  gstin: string | null;
  drugLicenceNumber: string | null;
  address: string | null;
  city: string | null;
  state: string | null;
  paymentTerms: string;
  openingBalance: number;
  active: boolean;
  showInPurchases: boolean;
};

export type PaymentPayload = {
  amount: number;
  mode: PaymentMode;
  note: string | null;
};

export type DistributorAccess = {
  create: boolean;
  update: boolean;
  inactivate: boolean;
  pay: boolean;
};

export function canOpenDistributors(
  role: string | null | undefined,
  permissions: string[] | undefined,
): boolean {
  return role === "owner" || (permissions ?? []).includes("distributors:read");
}

export function distributorAccess(
  role: string | null | undefined,
  permissions: string[] | undefined,
): DistributorAccess {
  const owner = role === "owner";
  const keys = permissions ?? [];
  return {
    create: owner || keys.includes("distributors:create"),
    update: owner || keys.includes("distributors:update"),
    inactivate: owner || keys.includes("distributors:delete"),
    pay: owner || keys.includes("distributors:pay"),
  };
}

export function isValidGstin(value: string): boolean {
  return GSTIN.test(value.trim().toUpperCase());
}

export function blankDraft(): DistributorDraft {
  return {
    name: "",
    contactPerson: "",
    phone: "",
    email: "",
    gstin: "",
    drugLicenceNumber: "",
    address: "",
    city: "",
    state: "",
    paymentTerms: "30 days credit",
    openingBalance: "0",
    active: true,
    showInPurchases: true,
  };
}

export function draftFromDistributor(distributor: Distributor): DistributorDraft {
  return {
    name: distributor.name,
    contactPerson: distributor.contactPerson ?? "",
    phone: distributor.phone,
    email: distributor.email ?? "",
    gstin: distributor.gstin ?? "",
    drugLicenceNumber: distributor.drugLicenceNumber ?? "",
    address: distributor.address ?? "",
    city: distributor.city ?? "",
    state: distributor.state ?? "",
    paymentTerms: distributor.paymentTerms,
    openingBalance: String(distributor.openingBalance),
    active: distributor.active,
    showInPurchases: distributor.showInPurchases,
  };
}

export function draftIsValid(draft: DistributorDraft): boolean {
  return draft.name.trim().length > 0 && draft.phone.trim().length > 0;
}

function emptyToNull(value: string): string | null {
  const trimmed = value.trim();
  return trimmed ? trimmed : null;
}

export function payload(draft: DistributorDraft): DistributorPayload {
  const opening = Number(draft.openingBalance);
  return {
    name: draft.name.trim(),
    contactPerson: emptyToNull(draft.contactPerson),
    phone: draft.phone.trim(),
    email: emptyToNull(draft.email),
    gstin: emptyToNull(draft.gstin)?.toUpperCase() ?? null,
    drugLicenceNumber: emptyToNull(draft.drugLicenceNumber)?.toUpperCase() ?? null,
    address: emptyToNull(draft.address),
    city: emptyToNull(draft.city),
    state: emptyToNull(draft.state),
    paymentTerms: draft.paymentTerms,
    openingBalance: Number.isInteger(opening) && opening >= 0 ? opening : 0,
    active: draft.active,
    showInPurchases: draft.showInPurchases,
  };
}

export function filterDistributors(rows: Distributor[], query: string): Distributor[] {
  const needle = query.trim().toLowerCase();
  if (!needle) return rows;
  return rows.filter((row) =>
    [row.name, row.gstin, row.phone, row.contactPerson, row.city, row.email]
      .filter(Boolean)
      .some((value) => value!.toLowerCase().includes(needle)),
  );
}

export function activeCount(rows: Distributor[]): number {
  return rows.filter((row) => row.active).length;
}

export function totalOutstanding(rows: Distributor[]): number {
  return rows.reduce((sum, row) => sum + row.outstanding, 0);
}

export function creditCount(rows: Distributor[]): number {
  return rows.filter((row) => row.paymentTerms.toLowerCase().includes("credit")).length;
}

export function outstandingTone(amount: number): string {
  if (amount > 0) return "text-[#b4232a]";
  if (amount < 0) return "text-green";
  return "text-dark";
}

export function inr(amount: number): string {
  return "₹" + Math.round(amount).toLocaleString("en-IN");
}

export function formatWhen(value: string): string {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "—";
  return date.toLocaleString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function modeLabel(mode: string | null): string {
  return PAYMENT_MODES.find((item) => item.value === mode)?.label ?? "";
}

export function typeLabel(type: TransactionType): string {
  if (type === "purchase") return "Purchase bill";
  if (type === "return") return "Return";
  return "Payment";
}

export type StatementRow = {
  id: string;
  when: string;
  type: string;
  reference: string;
  details: string;
  amount: string;
  balance: string;
};

export function statementRows(distributor: Distributor): StatementRow[] {
  let balance = distributor.openingBalance;
  const rows: StatementRow[] = [
    {
      id: "opening",
      when: "—",
      type: "Opening balance",
      reference: "—",
      details: "—",
      amount: inr(distributor.openingBalance),
      balance: inr(balance),
    },
  ];
  for (const line of distributor.transactions) {
    const increase = line.type === "purchase";
    balance += increase ? line.amount : -line.amount;
    const detail = [modeLabel(line.mode), line.note].filter(Boolean).join(" · ");
    rows.push({
      id: line.id,
      when: formatWhen(line.recordedAt),
      type: typeLabel(line.type),
      reference: line.reference || "—",
      details: detail || "—",
      amount: `${increase ? "+" : "−"}${inr(line.amount)}`,
      balance: inr(balance),
    });
  }
  return rows;
}

export function ledgerTotals(distributor: Distributor) {
  const purchases = distributor.transactions
    .filter((line) => line.type === "purchase")
    .reduce((sum, line) => sum + line.amount, 0);
  const payments = distributor.transactions
    .filter((line) => line.type === "payment")
    .reduce((sum, line) => sum + line.amount, 0);
  const returns = distributor.transactions
    .filter((line) => line.type === "return")
    .reduce((sum, line) => sum + line.amount, 0);
  return { opening: distributor.openingBalance, purchases, payments, returns };
}
