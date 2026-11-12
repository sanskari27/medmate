import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { Provider } from "react-redux";
import { MemoryRouter } from "react-router-dom";
import { afterEach, describe, expect, it, vi } from "vitest";
import { createAppStore } from "@/app/store";
import { writeSession } from "@/services/storage";
import type { Session } from "@/types";
import { InventoryPage } from "./InventoryPage";

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
    permissions: ["inventory:read"],
    pinSetupRequired: false,
  },
};

const longComposition = "Paracetamol 500 mg, Phenylephrine hydrochloride 10 mg, extra";

const inventory = {
  products: [
    {
      productId: "DR100",
      name: "Crocin Advance",
      marketer: "GSK",
      composition: longComposition,
      form: "Tablet",
      pack: "Strip",
      type: "Tablet",
      reorderLevel: 20,
      batches: [
        { batchNo: "B1", expiry: "2027-03", qty: 5, rate: "10.00", mrp: "18.00" },
        { batchNo: "OLD", expiry: "2026-01", qty: 0, rate: "10.00", mrp: "18.00" },
      ],
    },
    {
      productId: "DR80",
      name: "Bulk Drops",
      marketer: "Cipla",
      composition: "Sodium chloride",
      form: "Drops",
      pack: "Bottle",
      type: "Drops",
      reorderLevel: 10,
      batches: [{ batchNo: "B2", expiry: "2027-06", qty: 80, rate: "10.00", mrp: "15.00" }],
    },
    {
      productId: "DR4",
      name: "Costly Strip",
      marketer: "Abbott",
      composition: "Atorvastatin",
      form: "Tablet",
      pack: "Strip",
      type: "Tablet",
      reorderLevel: 20,
      batches: [{ batchNo: "B3", expiry: "2027-08", qty: 4, rate: "300.00", mrp: "400.00" }],
    },
    {
      productId: "DR0",
      name: "Empty Bottle",
      marketer: "None",
      composition: "",
      form: "Bottle",
      pack: "1",
      type: "Device",
      reorderLevel: 20,
      batches: [],
    },
  ],
};

function json(body: unknown) {
  return new Response(JSON.stringify(body), {
    status: 200,
    headers: { "content-type": "application/json" },
  });
}

function renderPage(permissions: string[] = ["inventory:read"]) {
  writeSession({ ...session, account: { ...session.account, permissions } });
  vi.stubGlobal(
    "fetch",
    vi.fn(async (input: RequestInfo | URL) => {
      const url = input instanceof Request ? input.url : String(input);
      if (url.includes("/pharmacy/purchases")) {
        return json({
          purchases: [
            {
              id: "PUR-1",
              type: "purchase",
              invoiceNo: "INV-9",
              invoiceDate: "2026-11-01",
              total: "120.00",
            },
          ],
          stats: {},
        });
      }
      return json(inventory);
    }),
  );
  return render(
    <Provider store={createAppStore()}>
      <MemoryRouter>
        <InventoryPage />
      </MemoryRouter>
    </Provider>,
  );
}

describe("InventoryPage", () => {
  afterEach(() => {
    cleanup();
    sessionStorage.clear();
    vi.unstubAllGlobals();
  });

  it("shows the stock cards, filters, and batches", async () => {
    renderPage();
    expect(await screen.findByText("Total SKUs")).toBeTruthy();
    expect(screen.getByText("Stock value at cost")).toBeTruthy();
    expect(screen.getByText("Retail value at MRP")).toBeTruthy();
    expect(screen.getByText("Low and out of stock")).toBeTruthy();
    expect(screen.getByText("Expiring within 4 months")).toBeTruthy();
    expect(screen.getByRole("button", { name: "All" })).toBeTruthy();
    expect(screen.getByRole("button", { name: "Low stock" })).toBeTruthy();
    expect(screen.getByRole("button", { name: "Out of stock" })).toBeTruthy();
    expect(screen.getByRole("button", { name: "Expiring" })).toBeTruthy();
    expect(screen.queryByRole("button", { name: "Export" })).toBeNull();
    expect(screen.getByText(`${longComposition.slice(0, 50)} · GSK`)).toBeTruthy();
    expect(screen.queryByText(longComposition)).toBeNull();

    fireEvent.change(screen.getByLabelText("Search inventory"), {
      target: { value: "extra" },
    });
    expect(screen.getByRole("button", { name: "Crocin Advance" })).toBeTruthy();
    expect(screen.queryByRole("button", { name: "Bulk Drops" })).toBeNull();
    fireEvent.change(screen.getByLabelText("Search inventory"), { target: { value: "" } });

    fireEvent.click(screen.getByRole("button", { name: "Low stock" }));
    expect(screen.getByRole("button", { name: "Crocin Advance" })).toBeTruthy();
    expect(screen.getByRole("button", { name: "Bulk Drops" })).toBeTruthy();
    expect(screen.queryByRole("button", { name: "Costly Strip" })).toBeNull();
    expect(screen.queryByRole("button", { name: "Empty Bottle" })).toBeNull();

    fireEvent.click(screen.getByRole("button", { name: "All" }));
    fireEvent.click(screen.getByRole("button", { name: "Crocin Advance" }));
    expect(screen.queryByText("Reorder level")).toBeNull();
    expect(screen.queryByRole("button", { name: "Save reorder level" })).toBeNull();
    expect(screen.queryByText("Purchase history")).toBeNull();
    expect(screen.queryByText("PUR-1")).toBeNull();
    expect(screen.getByText(longComposition)).toBeTruthy();
    expect(screen.getByText("Low stock — value under ₹1,000")).toBeTruthy();
    fireEvent.click(screen.getByRole("button", { name: "Batches" }));
    expect(await screen.findByText("PUR-1")).toBeTruthy();
    expect(screen.getByText("Purchase history")).toBeTruthy();
    expect(screen.getByRole("columnheader", { name: "Batch" })).toBeTruthy();
    expect(screen.getByRole("columnheader", { name: "Rate" })).toBeTruthy();
    expect(screen.getByText(/B1/)).toBeTruthy();
    expect(screen.queryByText(/OLD/)).toBeNull();
  });

  it("hides reorder with inventory:update and shows export with inventory:export", async () => {
    renderPage(["inventory:read", "inventory:update", "inventory:export"]);
    await screen.findByText("Total SKUs");
    expect(screen.getByRole("button", { name: "Export" })).toBeTruthy();
    fireEvent.click(screen.getByRole("button", { name: "Crocin Advance" }));
    expect(screen.queryByLabelText("Reorder level")).toBeNull();
    expect(screen.queryByRole("button", { name: "Save reorder level" })).toBeNull();
  });
});
