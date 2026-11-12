import type { VerificationStatus } from "@/types";

export const INVOICE_TEMPLATES = [
  { key: "classic", name: "Classic", desc: "Traditional GST invoice, ruled header" },
  { key: "modern", name: "Modern", desc: "Coloured header band with logo" },
  { key: "minimal", name: "Minimal", desc: "Clean, airy, thin lines" },
  { key: "thermal", name: "Thermal", desc: "80mm receipt / counter roll" },
] as const;

export type InvoiceTemplate = (typeof INVOICE_TEMPLATES)[number]["key"];

export const INVOICE_ACCENTS = [
  "#1B3D29",
  "#2F7D52",
  "#1f7d8c",
  "#2f5fd0",
  "#6d4fc4",
  "#b9842f",
  "#c0392b",
] as const;

export const INVOICE_TITLES = [
  "TAX INVOICE",
  "INVOICE",
  "RETAIL INVOICE",
  "BILL OF SUPPLY",
  "CASH MEMO",
  "CREDIT NOTE",
] as const;

export type InvoiceFile = {
  contentType: string;
  url: string;
};

export type InvoicePharmacy = {
  name: string;
  address: string;
  phone: string;
  email: string;
  gstin: string;
  drugLicenceNo: string;
  pharmacistName: string;
};

export type InvoiceSettingsView = InvoicePrintSettings & {
  pharmacy: InvoicePharmacy;
};

export type InvoicePrintSettings = {
  template: InvoiceTemplate;
  accent: string;
  title: string;
  prefix: string;
  signatory: string;
  bankLine: string;
  showBank: boolean;
  terms: string;
  showLogo: boolean;
  showStamp: boolean;
  logo: InvoiceFile | null;
  signature: InvoiceFile | null;
};

export type InvoiceDraft = {
  template: InvoiceTemplate;
  accent: string;
  title: string;
  prefix: string;
  signatory: string;
  bankLine: string;
  showBank: boolean;
  terms: string;
  showLogo: boolean;
  showStamp: boolean;
  logoFile?: File;
  signatureFile?: File;
};

export type InvoiceSaveResult = InvoicePrintSettings & {
  status: VerificationStatus;
  rejection: { stage: string; comment: string } | null;
  pinSetupRequired: boolean;
};

export function draftFromSettings(settings: InvoicePrintSettings): InvoiceDraft {
  return {
    template: settings.template,
    accent: settings.accent,
    title: settings.title,
    prefix: settings.prefix,
    signatory: settings.signatory,
    bankLine: settings.bankLine,
    showBank: settings.showBank,
    terms: settings.terms,
    showLogo: settings.showLogo,
    showStamp: settings.showStamp,
  };
}

export function isDirty(baseline: InvoiceDraft, draft: InvoiceDraft): boolean {
  if (draft.logoFile instanceof File || draft.signatureFile instanceof File) return true;
  return JSON.stringify(snapshot(baseline)) !== JSON.stringify(snapshot(draft));
}

export function signatureChanged(draft: InvoiceDraft): boolean {
  return draft.signatureFile instanceof File;
}

export function toFormData(draft: InvoiceDraft): FormData {
  const body = new FormData();
  body.set("template", draft.template);
  body.set("accent", draft.accent);
  body.set("title", draft.title.trim());
  body.set("prefix", draft.prefix.trim());
  body.set("signatory", draft.signatory.trim());
  body.set("bankLine", draft.bankLine.trim());
  body.set("showBank", String(draft.showBank));
  body.set("terms", draft.terms.trim());
  body.set("showLogo", String(draft.showLogo));
  body.set("showStamp", String(draft.showStamp));
  if (draft.logoFile instanceof File) body.set("logo", draft.logoFile);
  if (draft.signatureFile instanceof File) body.set("signature", draft.signatureFile);
  return body;
}

export function canOpenInvoiceSettings(
  role: string | null | undefined,
  permissions: string[] | undefined,
): boolean {
  return role === "owner" || (permissions ?? []).includes("invoice-settings:read");
}

export function canUpdateInvoiceSettings(
  role: string | null | undefined,
  permissions: string[] | undefined,
): boolean {
  return role === "owner" || (permissions ?? []).includes("invoice-settings:update");
}

function snapshot(draft: InvoiceDraft) {
  return {
    template: draft.template,
    accent: draft.accent,
    title: draft.title,
    prefix: draft.prefix,
    signatory: draft.signatory,
    bankLine: draft.bankLine,
    showBank: draft.showBank,
    terms: draft.terms,
    showLogo: draft.showLogo,
    showStamp: draft.showStamp,
  };
}
