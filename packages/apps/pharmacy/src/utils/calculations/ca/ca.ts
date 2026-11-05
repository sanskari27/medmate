// ── CA report sharing ───────────────────────────────────────────
export type AdvisorType = "CA" | "Accountant";
export type Advisor = {
  id: string;
  type: AdvisorType;
  name: string;
  firm: string;
  email: string;
  phone: string;
};
export const CA_REPORT_TYPES = [
  { key: "gst", label: "GST summary (GSTR-ready)", icon: "gst" },
  { key: "sales", label: "Sales register", icon: "sales" },
  { key: "purchase", label: "Purchase register", icon: "purchase" },
  { key: "pl", label: "Profit & Loss statement", icon: "pl" },
  { key: "stock", label: "Closing stock valuation", icon: "stock" },
];
export type CAShare = {
  id: string;
  period: string;
  reports: string[];
  sentTo: string;
  recipient: string;
  createdAt: number;
};
