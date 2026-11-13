export type PaymentMode = "cash" | "upi" | "card" | "cod";

export type ExpenseRow = {
  number: string;
  spentOn: string;
  party: string;
  category: string;
  paymentMode: PaymentMode;
  amount: string;
  gst: number;
  note: string | null;
};

export type ExpenseSummary = {
  count: number;
  total: string;
  gst: string;
};

export type ExpenseList = {
  expenses: ExpenseRow[];
  summary: ExpenseSummary;
  categories: string[];
  page: number;
  size: number;
  total: number;
};

export type ExpenseExport = {
  expenses: ExpenseRow[];
};

export type ExpenseDraft = {
  spentOn: string;
  party: string;
  category: string;
  customCategory: string;
  paymentMode: PaymentMode;
  amount: string;
  gst: number;
  note: string;
};

export const PAYMENT_MODES: { value: PaymentMode; label: string }[] = [
  { value: "cash", label: "Cash" },
  { value: "upi", label: "UPI" },
  { value: "card", label: "Card" },
  { value: "cod", label: "Cash on Delivery" },
];

export const GST_RATES = [0, 5, 12, 18, 28];

export const EXPENSE_PRESETS = [
  { key: "today", label: "Today" },
  { key: "yesterday", label: "Yesterday" },
  { key: "this-week", label: "This Week" },
  { key: "last-week", label: "Last Week" },
  { key: "last-7", label: "Last 7 Days" },
  { key: "this-month", label: "This Month" },
  { key: "prev-month", label: "Previous Month" },
  { key: "last-30", label: "Last 30 Days" },
  { key: "this-quarter", label: "This Quarter" },
  { key: "prev-quarter", label: "Previous Quarter" },
  { key: "this-fy", label: "Current Fiscal Year" },
  { key: "prev-fy", label: "Previous Fiscal Year" },
  { key: "last-365", label: "Last 365 Days" },
  { key: "all", label: "All" },
  { key: "custom", label: "Custom" },
] as const;

export type ExpensePreset = (typeof EXPENSE_PRESETS)[number]["key"];

export function canOpenExpenses(
  role: string | null | undefined,
  permissions: string[] | undefined,
) {
  return role === "owner" || (permissions ?? []).includes("expenses:read");
}

export function canCreateExpense(
  role: string | null | undefined,
  permissions: string[] | undefined,
) {
  return role === "owner" || (permissions ?? []).includes("expenses:create");
}

export function payLabel(mode: PaymentMode) {
  return PAYMENT_MODES.find((item) => item.value === mode)?.label ?? mode;
}

export function kolkataDate(now: Date) {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Kolkata",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(now);
}

export function expenseDate(iso: string) {
  const [year, month, day] = iso.split("-").map(Number);
  return new Date(Date.UTC(year ?? 1970, (month ?? 1) - 1, day ?? 1)).toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    timeZone: "UTC",
  });
}

export function inr(amount: string) {
  const negative = amount.startsWith("-");
  const body = (Math.abs(toPaise(amount)) / 100).toLocaleString("en-IN", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
  return negative ? `-₹${body}` : `₹${body}`;
}

export function expenseRange(preset: ExpensePreset, today: string, customFrom = "", customTo = "") {
  const label = EXPENSE_PRESETS.find((item) => item.key === preset)?.label ?? "Custom";
  const { year, month } = parts(today);
  switch (preset) {
    case "today":
      return { from: today, to: today, label };
    case "yesterday": {
      const day = shift(today, -1);
      return { from: day, to: day, label };
    }
    case "this-week": {
      const from = shift(today, -weekdayOffset(today));
      return { from, to: shift(from, 6), label };
    }
    case "last-week": {
      const from = shift(today, -weekdayOffset(today) - 7);
      return { from, to: shift(from, 6), label };
    }
    case "last-7":
      return { from: shift(today, -6), to: today, label };
    case "this-month":
      return { from: iso(year, month, 1), to: endOfMonth(year, month), label };
    case "prev-month": {
      const previous = month === 1 ? { year: year - 1, month: 12 } : { year, month: month - 1 };
      return {
        from: iso(previous.year, previous.month, 1),
        to: endOfMonth(previous.year, previous.month),
        label,
      };
    }
    case "last-30":
      return { from: shift(today, -29), to: today, label };
    case "this-quarter":
      return quarter(year, month, label);
    case "prev-quarter": {
      const current = Math.floor((month - 1) / 3);
      const yearOf = current === 0 ? year - 1 : year;
      const quarterIndex = current === 0 ? 3 : current - 1;
      return quarter(yearOf, quarterIndex * 3 + 1, label);
    }
    case "this-fy":
      return fiscal(month >= 4 ? year : year - 1, label);
    case "prev-fy":
      return fiscal((month >= 4 ? year : year - 1) - 1, label);
    case "last-365":
      return { from: shift(today, -364), to: today, label };
    case "all":
      return { from: "2000-01-01", to: today, label };
    case "custom": {
      const from = customFrom || shift(today, -29);
      const to = customTo || today;
      return { from, to, label: `${expenseDate(from)} - ${expenseDate(to)}` };
    }
  }
}

export function expenseTax(amount: string, gst: number) {
  const paise = toPaise(amount);
  if (paise <= 0 || gst <= 0) return { taxable: fromPaise(Math.max(paise, 0)), tax: "0.00" };
  const taxable = Math.round((paise * 100) / (100 + gst));
  return { taxable: fromPaise(taxable), tax: fromPaise(paise - taxable) };
}

export function expenseCsv(rows: ExpenseRow[]) {
  const lines = [["Expense no", "Date", "Paid to", "Category", "Mode", "Amount"].join(",")];
  let total = 0;
  for (const row of rows) {
    total += toPaise(row.amount);
    lines.push(
      [
        row.number,
        row.spentOn,
        cell(row.party),
        cell(row.category),
        payLabel(row.paymentMode),
        row.amount,
      ].join(","),
    );
  }
  lines.push(["TOTAL", "", "", "", "", fromPaise(total)].join(","));
  return lines.join("\n");
}

export function expensePdf(rows: ExpenseRow[]) {
  const lines = ["Expense no | Date | Paid to | Category | Mode | Amount"];
  let total = 0;
  for (const row of rows) {
    total += toPaise(row.amount);
    lines.push(
      [
        row.number,
        row.spentOn,
        row.party,
        row.category,
        payLabel(row.paymentMode),
        row.amount,
      ].join(" | "),
    );
  }
  lines.push(`TOTAL | | | | | ${fromPaise(total)}`);
  return pdfDocument(lines);
}

export function downloadFile(filename: string, contents: string, type: string) {
  const blob = new Blob([contents], { type });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(url);
}

export function savedCategory(draft: ExpenseDraft) {
  const custom = draft.customCategory.trim();
  return custom || draft.category;
}

export function canSaveExpense(draft: ExpenseDraft) {
  return draft.party.trim().length > 0 && toPaise(draft.amount) > 0;
}

function quarter(year: number, month: number, label: string) {
  const index = Math.floor((month - 1) / 3);
  const start = index * 3 + 1;
  return { from: iso(year, start, 1), to: endOfMonth(year, start + 2), label };
}

function fiscal(startYear: number, label: string) {
  return { from: iso(startYear, 4, 1), to: iso(startYear + 1, 3, 31), label };
}

function weekdayOffset(isoDate: string) {
  const { year, month, day } = parts(isoDate);
  const weekday = new Date(Date.UTC(year, month - 1, day)).getUTCDay();
  return (weekday + 6) % 7;
}

function endOfMonth(year: number, month: number) {
  return new Date(Date.UTC(year, month, 0)).toISOString().slice(0, 10);
}

function shift(isoDate: string, days: number) {
  const { year, month, day } = parts(isoDate);
  const date = new Date(Date.UTC(year, month - 1, day));
  date.setUTCDate(date.getUTCDate() + days);
  return date.toISOString().slice(0, 10);
}

function parts(isoDate: string) {
  const [year, month, day] = isoDate.split("-").map(Number);
  return { year: year ?? 1970, month: month ?? 1, day: day ?? 1 };
}

function iso(year: number, month: number, day: number) {
  return `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
}

function toPaise(amount: string) {
  const negative = amount.trim().startsWith("-");
  const [whole, fraction = ""] = amount.trim().replace("-", "").split(".");
  const paise = Number(whole || "0") * 100 + Number(fraction.padEnd(2, "0").slice(0, 2) || "0");
  return negative ? -paise : paise;
}

function fromPaise(paise: number) {
  const negative = paise < 0;
  const absolute = Math.abs(paise);
  const text = `${Math.floor(absolute / 100)}.${String(absolute % 100).padStart(2, "0")}`;
  return negative ? `-${text}` : text;
}

function cell(value: string) {
  if (/[",\n]/.test(value)) return `"${value.replaceAll('"', '""')}"`;
  return value;
}

function pdfDocument(lines: string[]) {
  const pageSize = 46;
  const pages: string[][] = [];
  for (let index = 0; index < lines.length; index += pageSize) {
    pages.push(lines.slice(index, index + pageSize));
  }
  if (pages.length === 0) pages.push([""]);
  const objects: string[] = [];
  const pageIds: number[] = [];
  let next = 3;
  const fontId = 3 + pages.length * 2;
  for (const page of pages) {
    const contentId = next;
    const pageId = next + 1;
    next += 2;
    pageIds.push(pageId);
    const commands = ["BT", "/F1 10 Tf", "40 760 Td"];
    page.forEach((line, index) => {
      if (index > 0) commands.push("0 -14 Td");
      commands.push(`(${pdfText(line)}) Tj`);
    });
    commands.push("ET");
    const stream = commands.join("\n");
    objects.push(
      `${contentId} 0 obj << /Length ${stream.length} >> stream\n${stream}\nendstream endobj\n`,
    );
    objects.push(
      `${pageId} 0 obj << /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Contents ${contentId} 0 R /Resources << /Font << /F1 ${fontId} 0 R >> >> >> endobj\n`,
    );
  }
  const kids = pageIds.map((id) => `${id} 0 R`).join(" ");
  const body = [
    "1 0 obj << /Type /Catalog /Pages 2 0 R >> endobj\n",
    `2 0 obj << /Type /Pages /Kids [${kids}] /Count ${pages.length} >> endobj\n`,
    ...objects,
    `${fontId} 0 obj << /Type /Font /Subtype /Type1 /BaseFont /Helvetica >> endobj\n`,
  ];
  let offset = "%PDF-1.4\n".length;
  const xref = ["0000000000 65535 f \n"];
  const chunks = body.map((object) => {
    xref.push(`${String(offset).padStart(10, "0")} 00000 n \n`);
    offset += object.length;
    return object;
  });
  const xrefAt = offset;
  return `%PDF-1.4\n${chunks.join("")}xref\n0 ${xref.length}\n${xref.join("")}trailer << /Size ${xref.length} /Root 1 0 R >>\nstartxref\n${xrefAt}\n%%EOF`;
}

function pdfText(value: string) {
  return value.replaceAll("\\", "\\\\").replaceAll("(", "\\(").replaceAll(")", "\\)");
}
