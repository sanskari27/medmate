export type WaitingStatus = "pending_compliance" | "pending_admin";

export type ApplicationSummary = {
  pharmacyId: string;
  name: string;
  phone: string;
  status: WaitingStatus;
  submittedAt: string | null;
};

export type ApplicationDocument = {
  slot: string;
  contentType: string;
  url: string;
};

export type ApplicationDetail = {
  pharmacyId: string;
  status: string;
  rejection: { stage: string; comment: string } | null;
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
  pharmacyType: string | null;
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
  documents: ApplicationDocument[];
};

export type DecisionBody = { decision: "approve" } | { decision: "reject"; comment: string };
