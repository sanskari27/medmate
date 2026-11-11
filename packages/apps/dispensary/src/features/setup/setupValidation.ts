import { hasDocument } from "./draft";
import { BUSINESS_TYPES, INDUSTRIES, REGIONS, REGISTRATION_TYPES } from "./options";
import type { DocumentSlot, SetupDraft } from "./types";

const GSTIN = /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z][1-9A-Z]Z[0-9A-Z]$/;
const PAN = /^[A-Z]{5}[0-9]{4}[A-Z]$/;
const PINCODE = /^[1-9][0-9]{5}$/;
const EMAIL = /^[^@\s]+@[^@\s]+\.[^@\s]+$/;
const PREFIX = /^[A-Za-z0-9-]{1,16}$/;
const DOCUMENT_TYPES = new Set(["image/jpeg", "image/png", "image/webp", "application/pdf"]);
const IMAGE_TYPES = new Set(["image/jpeg", "image/png", "image/webp"]);

function blank(value: string) {
  return value.trim().length === 0;
}

function media(type: string) {
  const base = type.split(";", 1)[0]?.trim().toLowerCase() ?? "";
  return base === "image/jpg" ? "image/jpeg" : base;
}

function fileIssue(file: File | undefined, label: string, imageOnly: boolean) {
  if (!file) return null;
  const allowed = imageOnly ? IMAGE_TYPES : DOCUMENT_TYPES;
  if (!allowed.has(media(file.type))) {
    return imageOnly ? `${label} must be an image` : `${label} must be an image or PDF`;
  }
  const max = imageOnly ? 2 * 1024 * 1024 : 5 * 1024 * 1024;
  if (file.size > max) return `${label} is too large`;
  return null;
}

function requiredFile(draft: SetupDraft, slot: DocumentSlot, label: string, imageOnly = false) {
  const chosen = fileIssue(draft.files[slot], label, imageOnly);
  if (chosen) return chosen;
  if (!hasDocument(draft, slot)) return `${label} is required`;
  return null;
}

function known(value: string, options: readonly string[]) {
  return options.includes(value);
}

export function stepIssue(draft: SetupDraft, step: number) {
  if (step === 1) return businessIssue(draft);
  if (step === 2) return locationIssue(draft);
  if (step === 3) return taxIssue(draft);
  if (step === 4) return pharmacistIssue(draft);
  if (step === 5) return invoiceIssue(draft);
  return null;
}

function businessIssue(draft: SetupDraft) {
  if (draft.pharmacyType !== "pharmacy" && draft.pharmacyType !== "hospital") {
    return "Pharmacy type is required";
  }
  if (blank(draft.name) || draft.name.trim().length > 160) return "Pharmacy name is required";
  if (draft.tagline.trim().length > 160) return "Tagline is too long";
  for (const type of draft.businessTypes) {
    if (!known(type, BUSINESS_TYPES)) return "Business type is not recognised";
  }
  if (!known(draft.registrationType, REGISTRATION_TYPES)) return "Registration type is required";
  if (!known(draft.industry, INDUSTRIES)) return "Industry is required";
  if (blank(draft.email) || draft.email.trim().length > 160 || !EMAIL.test(draft.email.trim())) {
    return "Email is required";
  }
  return null;
}

function locationIssue(draft: SetupDraft) {
  if (blank(draft.address) || draft.address.trim().length > 300)
    return "Billing address is required";
  if (blank(draft.city) || draft.city.trim().length > 80) return "City is required";
  if (!PINCODE.test(draft.pincode.trim())) return "Pincode is required";
  if (!known(draft.state, REGIONS)) return "State is required";
  return null;
}

function licenceNumber(value: string, label: string) {
  if (blank(value) || value.trim().length > 40) return `${label} number is required`;
  return null;
}

function taxIssue(draft: SetupDraft) {
  if (!GSTIN.test(draft.gstin.trim().toUpperCase())) return "Enter a valid GSTIN";
  const gst = requiredFile(draft, "gst", "GST certificate");
  if (gst) return gst;
  if (!PAN.test(draft.pan.trim().toUpperCase())) return "PAN number is required";
  const pan = requiredFile(draft, "pan", "PAN card");
  if (pan) return pan;
  const drug = licenceNumber(draft.drugLicenceNo, "Drug licence");
  if (drug) return drug;
  const drugFile = requiredFile(draft, "drug-licence", "Drug licence");
  if (drugFile) return drugFile;
  const fssai = licenceNumber(draft.fssaiNo, "FSSAI licence");
  if (fssai) return fssai;
  const fssaiFile = requiredFile(draft, "fssai", "FSSAI licence");
  if (fssaiFile) return fssaiFile;
  const trade = licenceNumber(draft.tradeLicenceNo, "Trade licence");
  if (trade) return trade;
  return requiredFile(draft, "trade-licence", "Trade licence");
}

function pharmacistIssue(draft: SetupDraft) {
  if (blank(draft.pharmacistName) || draft.pharmacistName.trim().length > 160) {
    return "Registered pharmacist name is required";
  }
  return requiredFile(draft, "pharmacist-certificate", "Pharmacist certificate");
}

function invoiceIssue(draft: SetupDraft) {
  if (!PREFIX.test(draft.invoicePrefix.trim())) return "Invoice prefix is required";
  const signature = requiredFile(draft, "signature", "Signature", true);
  if (signature) return signature;
  if (draft.terms.trim().length > 4000) return "Terms are too long";
  return fileIssue(draft.files.logo, "Logo", true);
}
