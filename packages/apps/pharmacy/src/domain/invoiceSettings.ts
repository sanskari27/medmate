// ── invoice settings (drives the printed invoice) ───────────────
export type InvoiceTemplate = "classic" | "modern" | "minimal" | "thermal";
export const INVOICE_TEMPLATES: { key: InvoiceTemplate; name: string; desc: string }[] = [
  { key: "classic", name: "Classic", desc: "Traditional GST invoice, ruled header" },
  { key: "modern", name: "Modern", desc: "Coloured header band with logo" },
  { key: "minimal", name: "Minimal", desc: "Clean, airy, thin lines" },
  { key: "thermal", name: "Thermal", desc: "80mm receipt / counter roll" },
];
export const INVOICE_ACCENTS = ["#1B3D29", "#2F7D52", "#1f7d8c", "#2f5fd0", "#6d4fc4", "#b9842f", "#c0392b"];
export const INVOICE_TITLES = ["TAX INVOICE", "INVOICE", "RETAIL INVOICE", "BILL OF SUPPLY", "CASH MEMO", "CREDIT NOTE"];
export type InvoiceSettings = {
  prefix: string;
  terms: string;
  footerNote: string;
  showSavings: boolean;
  includeDoctor: boolean;
  showBank: boolean;
  bankLine: string;
  signatory: string;
  // ── customisation ──
  template: InvoiceTemplate;
  accent: string;          // brand accent colour (header band / totals / title)
  title: string;           // document title text
  showLogo: boolean;       // render the pharmacy brand logo (profile.logo)
  showStamp: boolean;      // render the signature / seal stamp
  stamp?: string;          // data URL of an uploaded rubber-stamp / seal image
  showHsn: boolean;        // include the HSN column
};
export const DEFAULT_INVOICE_SETTINGS: InvoiceSettings = {
  prefix: "INV-",
  terms: "Goods once sold are not returnable. Subject to local jurisdiction.",
  footerNote: "Thank you — get well soon! Powered by Namma MedMate.",
  showSavings: true,
  includeDoctor: true,
  showBank: false,
  bankLine: "",
  signatory: "Authorised signatory",
  template: "classic",
  accent: "#1B3D29",
  title: "TAX INVOICE",
  showLogo: true,
  showStamp: false,
  showHsn: true,
};
