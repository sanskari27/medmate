// ── pharmacy profile (used on invoices & business settings) ─────
export type BizDetail = { label: string; value: string };
export type ProfileFile = { name: string; dataUrl: string };
export type PharmacyProfile = {
  name: string;
  tagline: string;
  logo?: string; // data URL
  phone: string;
  email: string;
  address: string;
  city: string;
  state: string;
  pincode: string;
  gstRegistered: boolean;
  gstin: string;
  eInvoicing: boolean;
  pan: string;
  dlNo: string; // drug licence no
  fssai: string; // FSSAI licence no
  tradeNo: string; // municipal trade licence no
  gstFile?: ProfileFile;
  panFile?: ProfileFile;
  dlFile?: ProfileFile;
  fssaiFile?: ProfileFile;
  tradeFile?: ProfileFile;
  enableTDS: boolean;
  enableTCS: boolean;
  businessTypes: string[];
  industryType: string;
  registrationType: string;
  signature?: string; // data URL (shown on invoices)
  extraDetails: BizDetail[]; // MSME, Website, etc.
  storeOpen: boolean; // accepting online orders
  pharmacist: string;
};
// ── payout bank account ─────────────────────────────────────────
export type BankAccount = {
  holderName: string;
  accountNumber: string;
  ifsc: string;
  bankName: string;
  branch?: string;
  accountType: "Savings" | "Current";
  upiVpa?: string;
  verified: boolean; // penny-drop verification status
  addedOn?: string; // ISO date
};
export const maskAccount = (n: string) => (n.length <= 4 ? n : "•••• " + n.slice(-4));
// basic IFSC sanity check: 4 letters + 0 + 6 alphanumerics
export const isValidIfsc = (s: string) => /^[A-Z]{4}0[A-Z0-9]{6}$/.test(s.trim().toUpperCase());
export const isValidGstin = (s: string) =>
  /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z][1-9A-Z]Z[0-9A-Z]$/.test(s.trim().toUpperCase());

export function setupGap(d: {
  name: string;
  registrationType: string;
  industryType: string;
  phone: string;
  email: string;
  address: string;
  city: string;
  state: string;
  pincode: string;
  gstin: string;
  pan: string;
  dlNo: string;
  fssai: string;
  tradeNo: string;
  pharmacist: string;
  invoicePrefix: string;
  signature?: string;
  gstFile?: ProfileFile;
  panFile?: ProfileFile;
  dlFile?: ProfileFile;
  fssaiFile?: ProfileFile;
  tradeFile?: ProfileFile;
}): { step: number; message: string } | null {
  const file = (f?: ProfileFile) => !!f?.dataUrl;
  if (!d.name.trim()) return { step: 1, message: "Pharmacy name is required" };
  if (!d.registrationType.trim()) return { step: 1, message: "Registration type is required" };
  if (!d.industryType.trim()) return { step: 1, message: "Industry is required" };
  if (d.phone.replace(/\D/g, "").length < 10)
    return { step: 1, message: "Enter a valid mobile number" };
  if (!/^\S+@\S+\.\S+$/.test(d.email.trim())) return { step: 1, message: "Email is required" };
  if (!d.address.trim() || !d.city.trim() || !INDIAN_STATES.includes(d.state) || !d.pincode.trim())
    return { step: 2, message: "Address, city, state and pincode are required" };
  if (!isValidGstin(d.gstin)) return { step: 3, message: "Enter a valid GSTIN" };
  if (!file(d.gstFile)) return { step: 3, message: "Attach the GST certificate" };
  if (!d.pan.trim()) return { step: 3, message: "PAN number is required" };
  if (!file(d.panFile)) return { step: 3, message: "Attach the PAN card" };
  if (!d.dlNo.trim()) return { step: 3, message: "Drug licence number is required" };
  if (!file(d.dlFile)) return { step: 3, message: "Attach the drug licence" };
  if (!d.fssai.trim()) return { step: 3, message: "FSSAI licence number is required" };
  if (!file(d.fssaiFile)) return { step: 3, message: "Attach the FSSAI licence" };
  if (!(d.tradeNo || "").trim()) return { step: 3, message: "Trade licence number is required" };
  if (!file(d.tradeFile)) return { step: 3, message: "Attach the trade licence" };
  if (!d.pharmacist.trim()) return { step: 4, message: "Registered pharmacist name is required" };
  if (!d.invoicePrefix.trim()) return { step: 5, message: "Invoice prefix is required" };
  if (!d.signature) return { step: 5, message: "Signature is required" };
  return null;
}

export const INDIAN_STATES = [
  "Andhra Pradesh",
  "Assam",
  "Bihar",
  "Chhattisgarh",
  "Delhi",
  "Goa",
  "Gujarat",
  "Haryana",
  "Himachal Pradesh",
  "Jharkhand",
  "Karnataka",
  "Kerala",
  "Madhya Pradesh",
  "Maharashtra",
  "Manipur",
  "Meghalaya",
  "Odisha",
  "Punjab",
  "Rajasthan",
  "Tamil Nadu",
  "Telangana",
  "Tripura",
  "Uttar Pradesh",
  "Uttarakhand",
  "West Bengal",
];
export const PHARMACY_BUSINESS_TYPES = [
  "Retail Pharmacy",
  "Wholesale / Distribution",
  "Hospital Pharmacy",
  "Online Pharmacy",
  "Ayurvedic / Generic",
  "Surgicals & Equipment",
];
export const REGISTRATION_TYPES = [
  "Proprietorship",
  "Partnership",
  "Private Limited Company",
  "LLP",
  "HUF",
  "Public Limited Company",
  "Not Registered",
];
export const INDUSTRY_TYPES = [
  "Pharmacy & Healthcare",
  "Retail",
  "Wholesale",
  "Hospital / Clinic",
  "Diagnostics",
];
export const DEFAULT_PROFILE: PharmacyProfile = {
  name: "",
  tagline: "",
  phone: "",
  email: "",
  address: "",
  city: "",
  state: "",
  pincode: "",
  gstRegistered: false,
  gstin: "",
  eInvoicing: false,
  pan: "",
  dlNo: "",
  fssai: "",
  tradeNo: "",
  enableTDS: false,
  enableTCS: false,
  businessTypes: [],
  industryType: "Pharmacy & Healthcare",
  registrationType: "Proprietorship",
  extraDetails: [],
  storeOpen: false,
  pharmacist: "",
};
