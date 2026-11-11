import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { applicationForm, draftFromApplication } from "../draft";
import type { PharmacyApplication } from "../types";
import { SetupWizard } from "./SetupWizard";

const application: PharmacyApplication = {
  pharmacyId: "pharmacy-id",
  status: "rejected",
  rejection: { stage: "compliance", comment: "Missing seal" },
  phone: "+919876543210",
  name: "Care Pharmacy",
  tagline: "Open late",
  email: "owner@example.com",
  address: "12 Market Road",
  city: "Bengaluru",
  state: "Karnataka",
  pincode: "560001",
  businessTypes: ["Retail Pharmacy"],
  industry: "Pharmacy & Healthcare",
  registrationType: "Proprietorship",
  pharmacyType: "pharmacy",
  gstin: "29ABCDE1234F1Z5",
  pan: "ABCDE1234F",
  drugLicenceNo: "DL-1",
  fssaiNo: "FSSAI-1",
  tradeLicenceNo: "TL-1",
  enableTds: false,
  enableTcs: false,
  pharmacistName: "Asha Rao",
  invoicePrefix: "CARE",
  terms: "Goods once sold",
  acceptOnlineOrders: true,
  selfOrderKiosk: false,
  eInvoicing: false,
  looseSelling: true,
  lowStockAlerts: true,
  submittedAt: "2026-11-11T10:00:00Z",
  documents: [
    { slot: "logo", contentType: "image/png", url: "/logo" },
    { slot: "gst", contentType: "application/pdf", url: "/gst" },
    { slot: "pan", contentType: "image/png", url: "/pan" },
    { slot: "drug-licence", contentType: "image/png", url: "/drug" },
    { slot: "fssai", contentType: "image/png", url: "/fssai" },
    { slot: "trade-licence", contentType: "image/png", url: "/trade" },
    { slot: "pharmacist-certificate", contentType: "application/pdf", url: "/pharmacist" },
    { slot: "signature", contentType: "image/png", url: "/signature" },
  ],
};

describe("SetupWizard", () => {
  it("shows the rejection comment and omits a stored document from the submit", async () => {
    const onSubmit = vi.fn(async (body: FormData) => {
      expect(body.get("pharmacyType")).toBe("pharmacy");
      expect(body.get("gstCertificate")).toBeNull();
      expect(body.get("name")).toBe("Care Pharmacy");
      return null;
    });
    render(
      <SetupWizard
        phone="+919876543210"
        application={application}
        onSubmit={onSubmit}
        onSignOut={() => undefined}
      />,
    );

    expect(screen.getByText("Missing seal")).toBeTruthy();
    expect(screen.getByText("Compliance rejected this application")).toBeTruthy();

    fireEvent.click(screen.getByRole("button", { name: "Get started" }));
    for (let step = 0; step < 6; step += 1) {
      fireEvent.click(screen.getByRole("button", { name: "Continue" }));
    }
    fireEvent.click(screen.getByRole("button", { name: "Finish setup" }));
    const confirm = screen.getAllByRole("button", { name: "Finish setup" });
    fireEvent.click(confirm[confirm.length - 1]);

    expect(onSubmit).toHaveBeenCalledOnce();
    expect(applicationForm(draftFromApplication(application)).get("gstCertificate")).toBeNull();
  });
});
