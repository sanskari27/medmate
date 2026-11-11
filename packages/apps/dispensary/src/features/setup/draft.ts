import type { DocumentSlot, DraftPatch, PharmacyApplication, SetupDraft } from "./types";
import { DOCUMENT_SLOTS } from "./types";

const FILE_PARTS: Record<DocumentSlot, string> = {
  logo: "logo",
  gst: "gstCertificate",
  pan: "panCard",
  "drug-licence": "drugLicence",
  fssai: "fssaiLicence",
  "trade-licence": "tradeLicence",
  "pharmacist-certificate": "pharmacistCertificate",
  signature: "signature",
};

function text(value: string | null | undefined) {
  return value ?? "";
}

export function emptyDraft(): SetupDraft {
  return {
    pharmacyType: "",
    name: "",
    tagline: "",
    businessTypes: [],
    registrationType: "",
    industry: "",
    email: "",
    address: "",
    city: "",
    pincode: "",
    state: "",
    gstin: "",
    pan: "",
    drugLicenceNo: "",
    fssaiNo: "",
    tradeLicenceNo: "",
    enableTds: false,
    enableTcs: false,
    pharmacistName: "",
    invoicePrefix: "",
    terms: "",
    acceptOnlineOrders: false,
    selfOrderKiosk: false,
    eInvoicing: false,
    looseSelling: false,
    files: {},
    stored: [],
  };
}

export function draftFromApplication(application: PharmacyApplication): SetupDraft {
  return {
    pharmacyType: application.pharmacyType ?? "",
    name: text(application.name),
    tagline: text(application.tagline),
    businessTypes: application.businessTypes ?? [],
    registrationType: text(application.registrationType),
    industry: text(application.industry),
    email: text(application.email),
    address: text(application.address),
    city: text(application.city),
    pincode: text(application.pincode),
    state: text(application.state),
    gstin: text(application.gstin),
    pan: text(application.pan),
    drugLicenceNo: text(application.drugLicenceNo),
    fssaiNo: text(application.fssaiNo),
    tradeLicenceNo: text(application.tradeLicenceNo),
    enableTds: application.enableTds,
    enableTcs: application.enableTcs,
    pharmacistName: text(application.pharmacistName),
    invoicePrefix: text(application.invoicePrefix),
    terms: text(application.terms),
    acceptOnlineOrders: application.acceptOnlineOrders,
    selfOrderKiosk: application.selfOrderKiosk,
    eInvoicing: application.eInvoicing,
    looseSelling: application.looseSelling,
    files: {},
    stored: application.documents ?? [],
  };
}

export function applyPatch(draft: SetupDraft, patch: DraftPatch): SetupDraft {
  const files = patch.files ? { ...draft.files } : draft.files;
  if (patch.files) {
    for (const slot of DOCUMENT_SLOTS) {
      if (!(slot in patch.files)) continue;
      const next = patch.files[slot];
      if (next) files[slot] = next;
      else delete files[slot];
    }
  }
  return { ...draft, ...patch, files, stored: draft.stored };
}

export function storedDocument(draft: SetupDraft, slot: DocumentSlot) {
  return draft.stored.find((document) => document.slot === slot);
}

export function hasDocument(draft: SetupDraft, slot: DocumentSlot) {
  return Boolean(draft.files[slot]) || Boolean(storedDocument(draft, slot));
}

export function applicationForm(draft: SetupDraft) {
  const body = new FormData();
  body.set("pharmacyType", draft.pharmacyType);
  body.set("name", draft.name.trim());
  if (draft.tagline.trim()) body.set("tagline", draft.tagline.trim());
  body.set("email", draft.email.trim());
  body.set("address", draft.address.trim());
  body.set("city", draft.city.trim());
  body.set("state", draft.state);
  body.set("pincode", draft.pincode.trim());
  for (const type of draft.businessTypes) body.append("businessTypes", type);
  body.set("industry", draft.industry);
  body.set("registrationType", draft.registrationType);
  body.set("gstin", draft.gstin.trim().toUpperCase());
  body.set("pan", draft.pan.trim().toUpperCase());
  body.set("drugLicenceNo", draft.drugLicenceNo.trim());
  body.set("fssaiNo", draft.fssaiNo.trim());
  body.set("tradeLicenceNo", draft.tradeLicenceNo.trim());
  body.set("enableTds", String(draft.enableTds));
  body.set("enableTcs", String(draft.enableTcs));
  body.set("pharmacistName", draft.pharmacistName.trim());
  body.set("invoicePrefix", draft.invoicePrefix.trim());
  if (draft.terms.trim()) body.set("terms", draft.terms.trim());
  body.set("acceptOnlineOrders", String(draft.acceptOnlineOrders));
  body.set("selfOrderKiosk", String(draft.selfOrderKiosk));
  body.set("eInvoicing", String(draft.eInvoicing));
  body.set("looseSelling", String(draft.looseSelling));
  for (const slot of DOCUMENT_SLOTS) {
    const file = draft.files[slot];
    if (file) body.set(FILE_PARTS[slot], file);
  }
  return body;
}
