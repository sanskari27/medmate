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

export function statusLabel(status: SupportCase["status"]): string {
  if (status === "waiting") return "Waiting";
  if (status === "open") return "Open";
  return "Resolved";
}
