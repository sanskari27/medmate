import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { SetupWizard } from "./SetupWizard";

vi.mock("@/hooks", () => ({
  usePharma: () => ({
    profile: {
      name: "",
      tagline: "",
      phone: "9886012345",
      email: "",
      address: "",
      city: "",
      state: "",
      pincode: "",
      gstRegistered: true,
      gstin: "",
      eInvoicing: false,
      pan: "",
      dlNo: "",
      fssai: "",
      tradeNo: "",
      enableTDS: false,
      enableTCS: false,
      businessTypes: [],
      industryType: "",
      registrationType: "",
      extraDetails: [],
      storeOpen: true,
      pharmacist: "",
    },
    invoiceSettings: { prefix: "INV-", terms: "Thanks" },
    kiosk: { enabled: false },
    commitSetup: async () => null,
    showFault: () => undefined,
    clearFault: () => undefined,
  }),
}));

describe("SetupWizard", () => {
  it("opens on the welcome step", () => {
    render(<SetupWizard />);
    expect(screen.getByRole("heading", { name: /^Welcome$/ })).toBeTruthy();
    expect(screen.getByRole("button", { name: "Get started" })).toBeTruthy();
  });
});
