export type BlockState = "clear" | "requested" | "blocked";

export type OwnerSummary = {
  pharmacyId: string;
  name: string | null;
  phone: string;
  status: string;
  blockState: BlockState;
};

export type OwnerDocument = {
  slot: string;
  contentType: string;
  url: string;
};

export type BlockRequest = {
  id: string;
  reason: string;
  requestedAt: string;
};

export type OwnerDetail = {
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
  documents: OwnerDocument[];
  blockState: BlockState;
  request: BlockRequest | null;
};
