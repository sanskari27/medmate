import { describe, expect, it } from "vitest";
import { hasDocument, emptyDraft } from "./draft";
import { stepIssue } from "./setupValidation";
import type { SetupDraft } from "./types";

function validDraft(): SetupDraft {
  return {
    ...emptyDraft(),
    pharmacyType: "pharmacy",
    name: "Care Pharmacy",
    registrationType: "Proprietorship",
    industry: "Pharmacy & Healthcare",
    email: "owner@example.com",
    address: "12 Market Road",
    city: "Bengaluru",
    pincode: "560001",
    state: "Karnataka",
    gstin: "29ABCDE1234F1Z5",
    pan: "ABCDE1234F",
    drugLicenceNo: "DL-1",
    fssaiNo: "FSSAI-1",
    tradeLicenceNo: "TL-1",
    pharmacistName: "Asha Rao",
    invoicePrefix: "CARE",
    stored: [
      { slot: "gst", contentType: "application/pdf", url: "/gst" },
      { slot: "pan", contentType: "image/png", url: "/pan" },
      { slot: "drug-licence", contentType: "image/png", url: "/drug" },
      { slot: "fssai", contentType: "image/png", url: "/fssai" },
      { slot: "trade-licence", contentType: "image/png", url: "/trade" },
      { slot: "pharmacist-certificate", contentType: "application/pdf", url: "/pharmacist" },
      { slot: "signature", contentType: "image/png", url: "/signature" },
    ],
  };
}

describe("stepIssue", () => {
  it("requires a pharmacy type", () => {
    const draft = validDraft();
    draft.pharmacyType = "";
    expect(stepIssue(draft, 1)).toBe("Pharmacy type is required");
    draft.pharmacyType = "hospital";
    expect(stepIssue(draft, 1)).toBeNull();
  });

  it("requires a six-digit pincode that does not start with zero", () => {
    const draft = validDraft();
    draft.pincode = "012345";
    expect(stepIssue(draft, 2)).toBe("Pincode is required");
    draft.pincode = "560001";
    expect(stepIssue(draft, 2)).toBeNull();
  });

  it("requires a GSTIN in the server pattern", () => {
    const draft = validDraft();
    draft.gstin = "bad";
    expect(stepIssue(draft, 3)).toBe("Enter a valid GSTIN");
  });

  it("accepts a stored document in place of a new file", () => {
    const draft = validDraft();
    draft.stored = draft.stored.filter((document) => document.slot !== "gst");
    expect(hasDocument(draft, "gst")).toBe(false);
    expect(stepIssue(draft, 3)).toBe("GST certificate is required");
    draft.stored = [...draft.stored, { slot: "gst", contentType: "application/pdf", url: "/gst" }];
    expect(stepIssue(draft, 3)).toBeNull();
  });

  it("requires the pharmacist certificate", () => {
    const draft = validDraft();
    draft.stored = draft.stored.filter((document) => document.slot !== "pharmacist-certificate");
    expect(stepIssue(draft, 4)).toBe("Pharmacist certificate is required");
    draft.stored = [
      ...draft.stored,
      { slot: "pharmacist-certificate", contentType: "application/pdf", url: "/pharmacist" },
    ];
    expect(stepIssue(draft, 4)).toBeNull();
  });
});
