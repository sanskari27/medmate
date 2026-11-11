import type { BlockState, OwnerDetail } from "./types";

const SLOT_LABELS: Record<string, string> = {
  logo: "Logo",
  gst: "GST certificate",
  pan: "PAN card",
  "drug-licence": "Drug licence",
  fssai: "FSSAI",
  "trade-licence": "Trade licence",
  "pharmacist-certificate": "Pharmacist certificate",
  signature: "Signature",
};

export type FieldRow = {
  label: string;
  value: string;
  dateTime?: string;
};

export type FieldSection = {
  title: string;
  rows: FieldRow[];
};

export function statusLabel(status: string): string {
  if (status === "incomplete") return "Incomplete";
  if (status === "rejected") return "Rejected";
  if (status === "pending_compliance") return "Compliance review";
  if (status === "pending_admin") return "Final review";
  if (status === "approved") return "Approved";
  return status;
}

export function blockLabel(state: BlockState): string {
  if (state === "requested") return "Block requested";
  if (state === "blocked") return "Blocked";
  return "Active";
}

export function slotLabel(slot: string): string {
  return SLOT_LABELS[slot] ?? slot;
}

export function textValue(value: string | null | undefined): string {
  const trimmed = value?.trim() ?? "";
  return trimmed.length > 0 ? trimmed : "—";
}

export function yesNo(value: boolean): string {
  return value ? "Yes" : "No";
}

export function listValue(values: string[]): string {
  return values.length > 0 ? values.join(", ") : "—";
}

export function formatWhen(value: string): string {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return new Intl.DateTimeFormat(undefined, {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(date);
}

export function isRemoteFile(url: string): boolean {
  return url.startsWith("https://");
}

export function rowName(name: string | null, phone: string): string {
  const trimmed = name?.trim() ?? "";
  return trimmed.length > 0 ? trimmed : phone;
}

export function ownerSections(detail: OwnerDetail): FieldSection[] {
  return [
    {
      title: "Summary",
      rows: [
        { label: "Status", value: statusLabel(detail.status) },
        { label: "Phone", value: textValue(detail.phone) },
        { label: "Email", value: textValue(detail.email) },
        {
          label: "Submitted",
          value: detail.submittedAt ? formatWhen(detail.submittedAt) : "—",
          dateTime: detail.submittedAt ?? undefined,
        },
      ],
    },
    {
      title: "Pharmacy",
      rows: [
        { label: "Name", value: textValue(detail.name) },
        { label: "Tagline", value: textValue(detail.tagline) },
        { label: "Address", value: textValue(detail.address) },
        { label: "City", value: textValue(detail.city) },
        { label: "State", value: textValue(detail.state) },
        { label: "Pincode", value: textValue(detail.pincode) },
      ],
    },
    {
      title: "Registration",
      rows: [
        { label: "Business types", value: listValue(detail.businessTypes) },
        { label: "Industry", value: textValue(detail.industry) },
        { label: "Registration type", value: textValue(detail.registrationType) },
        { label: "Pharmacy type", value: textValue(detail.pharmacyType) },
      ],
    },
    {
      title: "Licences",
      rows: [
        { label: "GSTIN", value: textValue(detail.gstin) },
        { label: "PAN", value: textValue(detail.pan) },
        { label: "Drug licence number", value: textValue(detail.drugLicenceNo) },
        { label: "FSSAI number", value: textValue(detail.fssaiNo) },
        { label: "Trade licence number", value: textValue(detail.tradeLicenceNo) },
        { label: "TDS", value: yesNo(detail.enableTds) },
        { label: "TCS", value: yesNo(detail.enableTcs) },
      ],
    },
    {
      title: "Billing",
      rows: [
        { label: "Pharmacist name", value: textValue(detail.pharmacistName) },
        { label: "Invoice prefix", value: textValue(detail.invoicePrefix) },
        { label: "Terms", value: textValue(detail.terms) },
        { label: "Online orders", value: yesNo(detail.acceptOnlineOrders) },
        { label: "Self-order kiosk", value: yesNo(detail.selfOrderKiosk) },
        { label: "e-Invoicing", value: yesNo(detail.eInvoicing) },
        { label: "Loose selling", value: yesNo(detail.looseSelling) },
        { label: "Low-stock alerts", value: yesNo(detail.lowStockAlerts) },
      ],
    },
  ];
}
