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

const REVIEW_SLOTS: DocumentSlot[] = [
  "gst",
  "pan",
  "drug-licence",
  "fssai",
  "trade-licence",
  "pharmacist-certificate",
  "signature",
];

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

export type ExtraDetail = { label: string; value: string };

export type ProfileDocument = {
  slot: string;
  contentType: string;
  url: string;
};

export type ProfileApplication = {
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
  eInvoicing: boolean;
  pharmacistName: string | null;
  terms: string | null;
  extraDetails?: ExtraDetail[];
  documents: ProfileDocument[];
};

export type ProfileForm = {
  name: string;
  tagline: string;
  email: string;
  address: string;
  city: string;
  state: string;
  pincode: string;
  businessTypes: string[];
  industry: string;
  registrationType: string;
  pharmacyType: string;
  gstin: string;
  pan: string;
  drugLicenceNo: string;
  fssaiNo: string;
  tradeLicenceNo: string;
  enableTds: boolean;
  enableTcs: boolean;
  eInvoicing: boolean;
  pharmacistName: string;
  terms: string;
  extraDetails: ExtraDetail[];
  removeLogo: boolean;
  files: Partial<Record<DocumentSlot, File | undefined>>;
};

export type ProfileSaveResult = {
  pharmacyId: string;
  status: VerificationStatus;
  rejection: { stage: string; comment: string } | null;
  pinSetupRequired: boolean;
};

function text(value: string | null | undefined) {
  return value ?? "";
}

export function formFromApplication(application: ProfileApplication): ProfileForm {
  return {
    name: text(application.name),
    tagline: text(application.tagline),
    email: text(application.email),
    address: text(application.address),
    city: text(application.city),
    state: text(application.state),
    pincode: text(application.pincode),
    businessTypes: [...application.businessTypes],
    industry: text(application.industry),
    registrationType: text(application.registrationType),
    pharmacyType: text(application.pharmacyType),
    gstin: text(application.gstin),
    pan: text(application.pan),
    drugLicenceNo: text(application.drugLicenceNo),
    fssaiNo: text(application.fssaiNo),
    tradeLicenceNo: text(application.tradeLicenceNo),
    enableTds: application.enableTds,
    enableTcs: application.enableTcs,
    eInvoicing: application.eInvoicing,
    pharmacistName: text(application.pharmacistName),
    terms: text(application.terms),
    extraDetails: (application.extraDetails ?? []).map((detail) => ({ ...detail })),
    removeLogo: false,
    files: {},
  };
}

export function needsReview(baseline: ProfileForm, draft: ProfileForm): boolean {
  if (code(baseline.gstin) !== code(draft.gstin) || code(baseline.pan) !== code(draft.pan)) {
    return true;
  }
  if (
    baseline.drugLicenceNo.trim() !== draft.drugLicenceNo.trim() ||
    baseline.fssaiNo.trim() !== draft.fssaiNo.trim() ||
    baseline.tradeLicenceNo.trim() !== draft.tradeLicenceNo.trim() ||
    baseline.pharmacistName.trim() !== draft.pharmacistName.trim()
  ) {
    return true;
  }
  return REVIEW_SLOTS.some((slot) => draft.files[slot] instanceof File);
}

export function isDirty(baseline: ProfileForm, draft: ProfileForm): boolean {
  if (baseline.removeLogo !== draft.removeLogo) return true;
  if (DOCUMENT_SLOTS.some((slot) => draft.files[slot] instanceof File)) return true;
  return JSON.stringify(snapshot(baseline)) !== JSON.stringify(snapshot(draft));
}

export function toFormData(draft: ProfileForm): FormData {
  const body = new FormData();
  body.set("name", draft.name.trim());
  body.set("tagline", draft.tagline.trim());
  body.set("email", draft.email.trim());
  body.set("address", draft.address.trim());
  body.set("city", draft.city.trim());
  body.set("state", draft.state);
  body.set("pincode", draft.pincode.trim());
  for (const type of draft.businessTypes) body.append("businessTypes", type);
  body.set("industry", draft.industry);
  body.set("registrationType", draft.registrationType);
  body.set("gstin", code(draft.gstin));
  body.set("pan", code(draft.pan));
  body.set("drugLicenceNo", draft.drugLicenceNo.trim());
  body.set("fssaiNo", draft.fssaiNo.trim());
  body.set("tradeLicenceNo", draft.tradeLicenceNo.trim());
  body.set("enableTds", String(draft.enableTds));
  body.set("enableTcs", String(draft.enableTcs));
  body.set("eInvoicing", String(draft.eInvoicing));
  body.set("pharmacistName", draft.pharmacistName.trim());
  body.set("terms", draft.terms.trim());
  body.set(
    "extraDetails",
    JSON.stringify(
      draft.extraDetails
        .map((detail) => ({ label: detail.label.trim(), value: detail.value.trim() }))
        .filter((detail) => detail.label && detail.value),
    ),
  );
  body.set("removeLogo", String(draft.removeLogo && !(draft.files.logo instanceof File)));
  for (const slot of DOCUMENT_SLOTS) {
    const file = draft.files[slot];
    if (file instanceof File) body.set(FILE_PARTS[slot], file);
  }
  return body;
}

function snapshot(form: ProfileForm) {
  return {
    name: form.name,
    tagline: form.tagline,
    email: form.email,
    address: form.address,
    city: form.city,
    state: form.state,
    pincode: form.pincode,
    businessTypes: form.businessTypes,
    industry: form.industry,
    registrationType: form.registrationType,
    gstin: form.gstin,
    pan: form.pan,
    drugLicenceNo: form.drugLicenceNo,
    fssaiNo: form.fssaiNo,
    tradeLicenceNo: form.tradeLicenceNo,
    enableTds: form.enableTds,
    enableTcs: form.enableTcs,
    eInvoicing: form.eInvoicing,
    pharmacistName: form.pharmacistName,
    terms: form.terms,
    extraDetails: form.extraDetails,
  };
}

function code(value: string) {
  return value.trim().toUpperCase();
}
