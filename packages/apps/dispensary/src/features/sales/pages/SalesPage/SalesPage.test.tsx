import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { Provider } from "react-redux";
import { MemoryRouter } from "react-router-dom";
import { afterEach, describe, expect, it, vi } from "vitest";
import { createAppStore } from "@/app/store";
import { writeSession } from "@/services/storage";
import type { Session } from "@/types";
import { SalesPage } from "./SalesPage";

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
    permissions: ["sales:read", "sales:return"],
    pinSetupRequired: false,
  },
};

const list = {
  sales: [
    {
      id: "INV-0001",
      type: "sale",
      invoiceNumber: "INV-0001",
      patientName: "Ada",
      recordedAt: "2026-11-12T05:00:00Z",
      items: 2,
      amount: "72.00",
    },
    {
      id: "RET-001",
      type: "return",
      invoiceNumber: "INV-0001",
      patientName: "Ada",
      recordedAt: "2026-11-12T06:00:00Z",
      items: 1,
      amount: "24.00",
    },
  ],
  stats: {
    salesThisMonth: "72.00",
    saleCount: 1,
    returnsThisMonth: "24.00",
    returnCount: 1,
    netThisMonth: "48.00",
  },
};

const sale = {
  sale: {
    type: "sale",
    id: "INV-0001",
    invoiceNumber: "INV-0001",
    patientName: "Ada",
    patientPhone: "9886012345",
    prescribedBy: null,
    prescriptionNumber: null,
    payMode: "cash",
    recordedAt: "2026-11-12T05:00:00Z",
    subtotal: "90.00",
    discount: "18.00",
    payable: "72.00",
    extraType: "none",
    extraValue: "0.00",
    extraAmount: "0.00",
    amount: "72.00",
    lines: [
      {
        position: 0,
        productId: "med-a",
        name: "Crocin Advance",
        composition: "Paracetamol",
        batchNo: "B1",
        expiry: "2027-06",
        qty: 2,
        returnedQty: 0,
        mrp: "30.00",
        unitPrice: "24.00",
        gst: 12,
        amount: "48.00",
      },
    ],
  },
};

const returned = {
  sale: {
    type: "return",
    id: "RET-001",
    invoiceNumber: "INV-0001",
    patientName: "Ada",
    patientPhone: "9886012345",
    prescribedBy: null,
    prescriptionNumber: null,
    payMode: null,
    recordedAt: "2026-11-12T06:00:00Z",
    subtotal: null,
    discount: null,
    payable: null,
    extraType: null,
    extraValue: null,
    extraAmount: null,
    amount: "24.00",
    lines: [
      {
        position: 0,
        productId: null,
        name: "Crocin Advance",
        composition: null,
        batchNo: "B1",
        expiry: "2027-06",
        qty: 1,
        returnedQty: null,
        mrp: null,
        unitPrice: null,
        gst: null,
        amount: "24.00",
      },
    ],
  },
};

const settings = {
  template: "classic",
  accent: "#1B3D29",
  title: "TAX INVOICE",
  prefix: "INV-",
  signatory: "Asha Rao",
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

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "content-type": "application/json" },
  });
}

const requested: string[] = [];

function renderPage(permissions: string[], path = "/") {
  writeSession({ ...session, account: { ...session.account, permissions } });
  vi.stubGlobal(
    "fetch",
    vi.fn(async (input: RequestInfo | URL) => {
      const url = String(input instanceof Request ? input.url : input);
      requested.push(url);
      if (url.includes("/pharmacy/sales/RET-001")) return json(returned);
      if (url.includes("/pharmacy/sales/INV-0001")) return json(sale);
      if (url.includes("/pharmacy/sales")) {
        const parsed = new URL(url, "http://localhost");
        const q = (parsed.searchParams.get("q") ?? "").toLowerCase();
        const type = parsed.searchParams.get("type") ?? "";
        const sales = list.sales.filter((row) => {
          if (type && row.type !== type) return false;
          if (!q) return true;
          return [row.id, row.invoiceNumber, row.patientName, row.type]
            .join(" ")
            .toLowerCase()
            .includes(q);
        });
        return json({
          ...list,
          sales,
          page: Number(parsed.searchParams.get("page") ?? 1),
          size: 25,
          total: q || type ? sales.length : 50,
        });
      }
      if (url.includes("/pharmacy/invoice-settings")) return json(settings);
      return json({ detail: "Not found" }, 404);
    }),
  );
  return render(
    <Provider store={createAppStore()}>
      <MemoryRouter initialEntries={[path]}>
        <SalesPage />
      </MemoryRouter>
    </Provider>,
  );
}

afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
  sessionStorage.clear();
  requested.length = 0;
});

describe("SalesPage", () => {
  it("shows the month cards and opens the invoice paper", async () => {
    renderPage(["sales:read", "sales:return"]);
    expect(await screen.findByText("Sales this month")).toBeTruthy();
    expect(screen.getByText("Returns this month")).toBeTruthy();
    expect(screen.getByText("Net this month")).toBeTruthy();
    expect(screen.getByText("Sales minus returns")).toBeTruthy();
    const invoices = screen.getAllByRole("button", { name: "INV-0001" });
    fireEvent.click(invoices[0]!);
    expect(await screen.findByRole("dialog", { name: "Invoice" })).toBeTruthy();
    expect(screen.getByRole("button", { name: "Return" })).toBeTruthy();
    expect(screen.getByRole("button", { name: "Print" })).toBeTruthy();
  });

  it("opens with the patient number already in the search", async () => {
    renderPage(["sales:read"], "/sales?q=9886012345&from=2025-05-13&to=2025-05-13");
    expect(await screen.findByLabelText("Search sales")).toHaveProperty("value", "9886012345");
    expect(screen.getByLabelText("From")).toHaveProperty("value", "2025-05-13");
    expect(screen.getByLabelText("To")).toHaveProperty("value", "2025-05-13");
    await waitFor(() => {
      expect(
        requested.some(
          (url) => url.includes("q=9886012345") && url.includes("from=2025-05-13"),
        ),
      ).toBe(true);
    });
  });

  it("hides Return without sales:return", async () => {
    renderPage(["sales:read"]);
    const invoices = await screen.findAllByRole("button", { name: "INV-0001" });
    fireEvent.click(invoices[0]!);
    expect(await screen.findByRole("dialog", { name: "Invoice" })).toBeTruthy();
    expect(screen.queryByRole("button", { name: "Return" })).toBeNull();
  });

  it("asks the server to filter and leaves the month cards", async () => {
    renderPage(["sales:read"]);
    expect(await screen.findByRole("button", { name: "RET-001" })).toBeTruthy();
    fireEvent.change(screen.getByRole("textbox", { name: "Search sales" }), {
      target: { value: "nobody" },
    });
    expect(await screen.findByText("No sales match your search.")).toBeTruthy();
    expect(screen.getByText("Sales this month")).toBeTruthy();
    expect(screen.getByText("₹72.00")).toBeTruthy();
    await waitFor(() => {
      expect(requested.some((url) => url.includes("q=nobody") && url.includes("page=1"))).toBe(
        true,
      );
    });
  });

  it("jumps to a page from the page field", async () => {
    renderPage(["sales:read"]);
    const page = await screen.findByLabelText("Page");
    fireEvent.change(page, { target: { value: "2" } });
    fireEvent.blur(page);
    await waitFor(() => {
      expect(requested.some((url) => url.includes("page=2"))).toBe(true);
    });
  });

  it("opens a return summary without print", async () => {
    renderPage(["sales:read"]);
    const returns = await screen.findAllByRole("button", { name: "RET-001" });
    fireEvent.click(returns[0]!);
    expect(await screen.findByRole("dialog", { name: "Return summary" })).toBeTruthy();
    expect(screen.getAllByText("RET-001").length).toBeGreaterThan(0);
    expect(screen.queryByRole("button", { name: "Print" })).toBeNull();
  });
});
