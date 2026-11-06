import { render, screen } from "@testing-library/react";
import { Provider } from "react-redux";
import { describe, expect, it } from "vitest";
import type { PharmacyProfile, Sale } from "@/utils";
import { store } from "@/store";
import ShareSheet from "./ShareSheet";

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
  businessTypes: [],
  industryType: "Pharmacy & Healthcare",
  registrationType: "Proprietorship",
  extraDetails: [],
  storeOpen: true,
  pharmacist: "Anita Rao",
} satisfies PharmacyProfile;

const sale = {
  id: "INV-9",
  channel: "offline",
  status: "completed",
  customer: { name: "Asha", phone: "9886012345" },
  items: [
    {
      productId: "p1",
      name: "Paracetamol",
      batchNo: "B1",
      expiry: "12/28",
      hsn: "3004",
      qty: 1,
      mrp: 20,
      price: 18,
      gst: 12,
    },
  ],
  discount: 0,
  payMode: "upi",
  rx: false,
  createdAt: Date.parse("2026-06-15T10:00:00"),
} satisfies Sale;

describe("ShareSheet", () => {
  it("renders the bill share dialog", () => {
    function onClose() {
      return undefined;
    }
    render(
      <Provider store={store}>
        <ShareSheet sale={sale} profile={profile} onClose={onClose} />
      </Provider>,
    );
    expect(screen.getByRole("heading", { name: "Share bill INV-9" })).toBeTruthy();
    expect(
      screen.getByRole("button", { name: "WhatsApp Send bill link on WhatsApp" }),
    ).toBeTruthy();
  });
});
