import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { Provider } from "react-redux";
import { afterEach, describe, expect, it, vi } from "vitest";
import { createAppStore } from "@/app/store";
import { writeSession } from "@/services/storage";
import type { Session } from "@/types";
import { BillingPage } from "./BillingPage";

const session: Session = {
  accessToken: "access",
  refreshToken: "refresh",
  expiresIn: 900,
  account: {
    id: "account-id",
    accountType: "pharmacy",
    phone: "+919876543210",
    displayName: "Ada",
    pharmacyId: "pharmacy-1",
    pharmacyRole: "staff",
    verificationStatus: "approved",
    rejection: null,
    subtypes: [],
    permissions: ["billing:read", "billing:create"],
    pinSetupRequired: false,
  },
};

const inventory = {
  products: [
    {
      productId: "med-a",
      name: "Crocin Advance",
      marketer: "GSK",
      composition: "Paracetamol",
      form: "Tablet",
      pack: "Strip",
      type: "allopathy",
      reorderLevel: 20,
      rack: null,
      rackAlt: null,
      prescriptionRequired: false,
      batches: [{ batchNo: "B1", expiry: "2027-06", qty: 5, rate: "10.00", mrp: "30.00", gst: 12 }],
    },
  ],
};

const offers = {
  offers: [
    {
      id: "OFR-001",
      title: "Ten percent",
      code: "TEN",
      type: "pct",
      value: 10,
      scope: "all",
      target: null,
      active: true,
      itemCount: 1,
    },
  ],
  products: [],
};

const settings = {
  template: "classic",
  accent: "#1B3D29",
  title: "TAX INVOICE",
  prefix: "INV-",
  signatory: "Authorised signatory",
  bankLine: "",
  showBank: false,
  terms: "",
  showLogo: false,
  showStamp: false,
  logo: null,
  signature: null,
  pharmacy: {
    name: "Care Pharmacy",
    address: "12 Market Road",
    phone: "+919876543210",
    email: "owner@example.com",
    gstin: "29ABCDE1234F1Z5",
    drugLicenceNo: "DL-1",
    pharmacistName: "Asha Rao",
  },
};

const posted = {
  bill: {
    number: "INV-0001",
    patientName: "Ada",
    patientPhone: "9886012345",
    prescribedBy: null,
    prescriptionNumber: null,
    payMode: "cash",
    soldAt: "2026-11-12T05:00:00Z",
    subtotal: "30.00",
    discount: "3.00",
    payable: "27.00",
    lines: [
      {
        productId: "med-a",
        name: "Crocin Advance",
        composition: "Paracetamol",
        batchNo: "B1",
        expiry: "2027-06",
        qty: 1,
        mrp: "30.00",
        unitPrice: "27.00",
        gst: 12,
        offerId: "OFR-001",
        offerTitle: "Ten percent",
        discount: "3.00",
      },
    ],
  },
};

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "content-type": "application/json" },
  });
}

const requested: string[] = [];

function renderPage(permissions: string[]) {
  writeSession({ ...session, account: { ...session.account, permissions } });
  vi.stubGlobal(
    "fetch",
    vi.fn(async (input: RequestInfo | URL, init?: RequestInit) => {
      const url = String(input instanceof Request ? input.url : input);
      requested.push(url);
      const method = input instanceof Request ? input.method : (init?.method ?? "GET");
      if (url.includes("/pharmacy/bills") && method === "POST") return json(posted, 201);
      if (url.includes("/pharmacy/inventory")) return json(inventory);
      if (url.includes("/pharmacy/offers")) return json(offers);
      if (url.includes("/pharmacy/invoice-settings")) return json(settings);
      return json({ detail: "Not found" }, 404);
    }),
  );
  return render(
    <Provider store={createAppStore()}>
      <BillingPage />
    </Provider>,
  );
}

afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
  sessionStorage.clear();
  requested.length = 0;
});

describe("BillingPage", () => {
  it("lists a composition match, requires a batch, and keeps UPI and Card disabled", async () => {
    renderPage(["billing:read", "billing:create"]);
    const scan = await screen.findByLabelText("Scan or search");
    expect(requested.some((url) => url.includes("/pharmacy/inventory"))).toBe(false);
    fireEvent.change(scan, { target: { value: "para" } });
    expect(await screen.findByText(/Paracetamol/)).toBeTruthy();
    await waitFor(() => {
      expect(
        requested.some(
          (url) =>
            url.includes("/pharmacy/inventory") && url.includes("size=8") && url.includes("q=para"),
        ),
      ).toBe(true);
    });
    expect(screen.getByText(/med-a/)).toBeTruthy();
    expect(screen.getByRole("listbox", { name: "Matches" }).className).toContain("absolute");
    expect(screen.getByRole("table", { name: "Cart" })).toBeTruthy();
    expect(screen.getByRole("columnheader", { name: "CGST" })).toBeTruthy();
    expect(screen.getByRole("columnheader", { name: "SGST" })).toBeTruthy();
    expect(screen.getByRole("columnheader", { name: "Discount" })).toBeTruthy();
    expect(screen.getByRole("columnheader", { name: "Amount" })).toBeTruthy();
    fireEvent.keyDown(scan, { key: "Enter" });
    expect(screen.getByLabelText("Batch for Crocin Advance")).toBeTruthy();
    expect(screen.getByLabelText("Special discount for Crocin Advance")).toBeTruthy();
    const qty = screen.getByLabelText("Quantity for Crocin Advance") as HTMLInputElement;
    fireEvent.change(qty, { target: { value: "4" } });
    expect(qty.value).toBe("4");
    fireEvent.keyDown(qty, { key: "F3" });
    expect(document.activeElement).toBe(scan);
    expect((screen.getByRole("button", { name: "Charge" }) as HTMLButtonElement).disabled).toBe(
      true,
    );
    expect((screen.getByRole("radio", { name: "UPI" }) as HTMLInputElement).disabled).toBe(true);
    expect((screen.getByRole("radio", { name: "Card" }) as HTMLInputElement).disabled).toBe(true);
    expect((screen.getByRole("radio", { name: "Cash" }) as HTMLInputElement).checked).toBe(true);
  });

  it("hides Charge without billing:create", async () => {
    renderPage(["billing:read"]);
    expect(await screen.findByLabelText("Scan or search")).toBeTruthy();
    expect(screen.queryByRole("button", { name: "Charge" })).toBeNull();
  });

  it("shows the winning offer and the posted invoice", async () => {
    renderPage(["billing:read", "billing:create"]);
    const scan = await screen.findByLabelText("Scan or search");
    fireEvent.change(scan, { target: { value: "med-a" } });
    expect(await screen.findByText(/Crocin Advance/)).toBeTruthy();
    fireEvent.keyDown(scan, { key: "Enter" });
    fireEvent.change(screen.getByLabelText("Batch for Crocin Advance"), {
      target: { value: "B1" },
    });
    expect(screen.getByText(/Ten percent/)).toBeTruthy();
    expect(screen.getAllByText("₹2.89").length).toBeGreaterThan(0);
    expect(screen.getAllByText("₹1.45").length).toBeGreaterThan(0);
    expect(screen.getAllByText("₹1.44").length).toBeGreaterThan(0);
    fireEvent.change(screen.getByLabelText("Extra discount"), { target: { value: "flat" } });
    fireEvent.change(screen.getByLabelText("Rupees"), { target: { value: "2" } });
    expect(screen.getAllByText("₹25.00").length).toBeGreaterThan(0);
    fireEvent.change(screen.getByLabelText("Patient name"), { target: { value: "Ada" } });
    fireEvent.change(screen.getByLabelText("Phone"), { target: { value: "9886012345" } });
    fireEvent.click(screen.getByRole("button", { name: "Charge" }));
    expect(await screen.findByRole("dialog", { name: "Invoice" })).toBeTruthy();
    const paper = document.querySelector(".print-area");
    expect(paper?.textContent).toContain("INV-0001");
    expect(screen.getByRole("button", { name: "New bill" })).toBeTruthy();
  });
});
