export type Faq = {
  id: string;
  question: string;
  answer: string;
  position: number;
  published: boolean;
};

export type SupportMessage = {
  id: string;
  authorId: string;
  authorName: string;
  body: string;
  createdAt: string;
};

export type SupportCase = {
  id: string;
  ticketNumber: string;
  pharmacyId: string;
  pharmacyName: string;
  subject: string;
  category: string;
  status: "waiting" | "open" | "resolved";
  assigneeId: string | null;
  assigneeName: string | null;
  createdAt: string;
  resolvedAt: string | null;
  messages?: SupportMessage[];
};

export const TICKET_CATEGORIES = [
  "Billing",
  "Inventory",
  "Online store",
  "Payments",
  "Account",
  "Other",
] as const;

export type CasePage = {
  cases: SupportCase[];
  page: number;
  size: number;
  total: number;
};

export function caseRows(data: CasePage | SupportCase[] | undefined): SupportCase[] {
  if (!data) return [];
  return Array.isArray(data) ? data : (data.cases ?? []);
}

export function caseTotal(data: CasePage | SupportCase[] | undefined): number {
  if (!data) return 0;
  return Array.isArray(data) ? data.length : data.total;
}

export function statusLabel(status: SupportCase["status"]): string {
  if (status === "waiting") return "Waiting";
  if (status === "open") return "Open";
  return "Resolved";
}

export function timeAgo(iso: string, now = Date.now()): string {
  const then = Date.parse(iso);
  if (Number.isNaN(then)) return "";
  const minutes = Math.max(0, Math.round((now - then) / 60000));
  if (minutes < 1) return "just now";
  if (minutes < 60) return `${minutes} m ago`;
  const hours = Math.round(minutes / 60);
  if (hours < 24) return `${hours} h ago`;
  const days = Math.round(hours / 24);
  return `${days} d ago`;
}
