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
