import { render, screen } from "@testing-library/react";
import { Provider } from "react-redux";
import { describe, expect, it } from "vitest";
import type { PharmacyProfile, Sale } from "@/utils";
import { store } from "@/store";
import Invoice from "./Invoice";

const profile = {
  name: "Sri Sai Medicals",
  tagline: "",
  phone: "9886012345",
  email: "store@example.com",
  address: "MG Road",
  city: "Bengaluru",
  state: "Karnataka",
  pincode: "560001",
  gstRegistered: true,
  gstin: "29ABCDE1234F1Z5",
  eInvoicing: false,
  pan: "ABCDE1234F",
  dlNo: "DL-1",
  fssai: "FSSAI-1",
  tradeNo: "TR-1",
  enableTDS: false,
  enableTCS: false,
  businessTypes: ["Retail Pharmacy"],
  industryType: "Pharmacy & Healthcare",
  registrationType: "Proprietorship",
  extraDetails: [],
  storeOpen: true,
  pharmacist: "Anita Rao",
} satisfies PharmacyProfile;

const sale = {
  id: "INV-1",
  channel: "offline",
  status: "completed",
  customer: { name: "Asha", phone: "9886012345", doctor: "Dr. Rao" },
  items: [
    {
      productId: "p1",
      name: "Paracetamol",
      batchNo: "B1",
      expiry: "12/28",
      hsn: "3004",
      qty: 2,
      mrp: 20,
      price: 18,
      gst: 12,
    },
  ],
  discount: 0,
  payMode: "cash",
  rx: false,
  createdAt: Date.parse("2026-06-15T10:00:00"),
} satisfies Sale;

describe("Invoice", () => {
  it("renders the tax invoice title and pharmacy name", () => {
    render(
      <Provider store={store}>
        <Invoice sale={sale} profile={profile} />
      </Provider>,
    );
    expect(screen.getByText("TAX INVOICE")).toBeTruthy();
    expect(screen.getByRole("heading", { name: "Sri Sai Medicals" })).toBeTruthy();
    expect(screen.getByText("Paracetamol")).toBeTruthy();
  });
});
