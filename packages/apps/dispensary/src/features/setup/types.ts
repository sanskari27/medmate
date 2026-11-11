import type { VerificationStatus } from "@/types";

export const DOCUMENT_SLOTS = [
  "logo",
  "gst",
  "pan",
  "drug-licence",
  "fssai",
  "trade-licence",
  "pharmacist-certificate",
  "signature",
] as const;

export type DocumentSlot = (typeof DOCUMENT_SLOTS)[number];

export type PharmacyType = "pharmacy" | "hospital";

export type StoredDocument = {
  slot: string;
  contentType: string;
  url: string;
};

export type Rejection = {
  stage: string;
  comment: string;
};

export type PharmacyApplication = {
  pharmacyId: string;
  status: VerificationStatus;
  rejection: Rejection | null;
  phone: string;
  name: string | null;
  tagline: string | null;
  email: string | null;
  address: string | null;
  city: string | null;
  state: string | null;
  pincode: string | null;
  businessTypes: string[];
  industry: string | null;
  registrationType: string | null;
  pharmacyType: PharmacyType | null;
  gstin: string | null;
  pan: string | null;
  drugLicenceNo: string | null;
  fssaiNo: string | null;
  tradeLicenceNo: string | null;
  enableTds: boolean;
  enableTcs: boolean;
  pharmacistName: string | null;
  invoicePrefix: string | null;
  terms: string | null;
  acceptOnlineOrders: boolean;
  selfOrderKiosk: boolean;
  eInvoicing: boolean;
  looseSelling: boolean;
  lowStockAlerts: boolean;
  submittedAt: string | null;
  documents: StoredDocument[];
};

export type VerificationResult = {
  pharmacyId: string;
  status: VerificationStatus;
  rejection: Rejection | null;
  pinSetupRequired: boolean;
};

export type SetupDraft = {
  pharmacyType: "" | PharmacyType;
  name: string;
  tagline: string;
  businessTypes: string[];
  registrationType: string;
  industry: string;
  email: string;
  address: string;
  city: string;
  pincode: string;
  state: string;
  gstin: string;
  pan: string;
  drugLicenceNo: string;
  fssaiNo: string;
  tradeLicenceNo: string;
  enableTds: boolean;
  enableTcs: boolean;
  pharmacistName: string;
  invoicePrefix: string;
  terms: string;
  acceptOnlineOrders: boolean;
  selfOrderKiosk: boolean;
  eInvoicing: boolean;
  looseSelling: boolean;
  files: Partial<Record<DocumentSlot, File>>;
  stored: StoredDocument[];
};

export type DraftPatch = Partial<Omit<SetupDraft, "files" | "stored">> & {
  files?: Partial<Record<DocumentSlot, File | undefined>>;
};
