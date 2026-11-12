import { act, cleanup, fireEvent, render, screen } from "@testing-library/react";
import { Provider } from "react-redux";
import { MemoryRouter } from "react-router-dom";
import { afterEach, describe, expect, it, vi } from "vitest";
import { createAppStore } from "@/app/store";
import { writeSession } from "@/services/storage";
import type { Session } from "@/types";
import { PurchasesPage } from "./PurchasesPage";

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
    pharmacyRole: "owner",
    verificationStatus: "approved",
    rejection: null,
    subtypes: [],
    permissions: [],
    pinSetupRequired: false,
  },
};

const purchases = {
  purchases: [
    {
      id: "PUR-001",
      type: "purchase",
      purchaseId: null,
      distributorId: "DST-001",
      distributorName: "Bengaluru Pharma",
      invoiceNo: "INV-1",
      invoiceDate: "2026-11-01",
      recordedAt: "2026-11-12T04:00:00Z",
      taxable: "21.00",
      gst: "0.00",
      total: "21.00",
      ledgerAmount: 21,
      units: 2,
      lines: [
        {
          position: 0,
          productId: "DR100",
          name: "Crocin Advance",
          batchNo: "B1",
          expiry: "2027-06",
          qty: 2,
          freeQty: 0,
          rate: "10.50",
          mrp: "18.00",
          gst: 0,
          amount: "21.00",
          returnedQty: 0,
          returnedFree: 0,
          onHand: 2,
        },
      ],
    },
  ],
  stats: {
    purchasesThisMonth: 21,
    purchaseCount: 1,
    outstanding: -11,
    returnsThisMonth: 11,
    returnCount: 1,
  },
};

const searches: { url: string; signal?: AbortSignal }[] = [];

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "content-type": "application/json" },
  });
}

function renderPage(
  role: Session["account"]["pharmacyRole"] = "owner",
  permissions: string[] = [],
) {
  writeSession({ ...session, account: { ...session.account, pharmacyRole: role, permissions } });
  vi.stubGlobal(
    "fetch",
    vi.fn(async (input: RequestInfo | URL, init?: RequestInit) => {
      const url = input instanceof Request ? input.url : String(input);
      const method = input instanceof Request ? input.method : init?.method;
      if (url.includes("/pharmacy/medicines/validate") && method === "POST") {
        return json({
          products: [
            {
              productId: "DR100",
              name: "Crocin Advance",
              marketer: "GSK",
              pack: "Strip",
              mrp: 18,
              composition: "Paracetamol 500 mg",
              form: "Tablet",
              type: "Tablet",
            },
          ],
          missing: [],
          ambiguous: [],
        });
      }
      if (url.includes("/pharmacy/medicines/search")) {
        const signal = input instanceof Request ? input.signal : init?.signal;
        searches.push({ url, signal: signal ?? undefined });
        return new Promise((resolve, reject) => {
          const timer = setTimeout(() => resolve(json({ medicines: [] })), 5000);
          const abort = () => {
            clearTimeout(timer);
            reject(new DOMException("Aborted", "AbortError"));
          };
          if (signal?.aborted) {
            abort();
            return;
          }
          signal?.addEventListener("abort", abort, { once: true });
        });
      }
      if (url.includes("/pharmacy/distributors")) return json({ distributors: [] });
      return json(purchases);
    }),
  );
  return render(
    <Provider store={createAppStore()}>
      <MemoryRouter>
        <PurchasesPage />
      </MemoryRouter>
    </Provider>,
  );
}

describe("PurchasesPage", () => {
  afterEach(() => {
    cleanup();
    sessionStorage.clear();
    searches.length = 0;
    vi.useRealTimers();
    vi.unstubAllGlobals();
  });

  it("shows the month cards and the entry actions", async () => {
    renderPage();
    expect(await screen.findByText("Purchases this month")).toBeTruthy();
    expect(screen.getByText("Total outstanding payable")).toBeTruthy();
    expect(screen.getByText("Returns this month")).toBeTruthy();
    expect(screen.getAllByText("₹21").length).toBeGreaterThan(0);
    expect(screen.getByText("1 bills")).toBeTruthy();
    expect(screen.getByText("1 returns")).toBeTruthy();
    expect(screen.queryByRole("button", { name: "More ways to add a purchase" })).toBeNull();
    fireEvent.click(screen.getByRole("button", { name: "New purchase entry" }));
    expect(screen.getByRole("button", { name: "Upload CSV" })).toBeTruthy();
    expect(screen.getByRole("button", { name: "Download sample" })).toBeTruthy();
  });

  it("leaves a rejected CSV row out of the form", async () => {
    renderPage();
    await screen.findByText("Purchases this month");
    fireEvent.click(screen.getByRole("button", { name: "New purchase entry" }));
    const csv = `product_id,batch_no,expiry,qty,free,rate,mrp,gst
DR100,B1,2027-06,2,0,10.50,18,12
NOPE,B2,2027-06,1,0,5,10,99
`;
    fireEvent.change(screen.getByLabelText("Purchase CSV"), {
      target: { files: [new File([csv], "bill.csv", { type: "text/csv" })] },
    });
    expect(await screen.findByText("Row 3: GST percent is not recognised")).toBeTruthy();
    expect(screen.getByDisplayValue("Crocin Advance")).toBeTruthy();
    expect(screen.queryByDisplayValue("NOPE")).toBeNull();
  });

  it("debounces medicine search and aborts the previous request", async () => {
    renderPage();
    await screen.findByText("Purchases this month");
    fireEvent.click(screen.getByRole("button", { name: "New purchase entry" }));
    const medicine = screen.getByLabelText("Medicine line");
    vi.useFakeTimers();
    fireEvent.change(medicine, { target: { value: "cr" } });
    await act(async () => {
      await vi.advanceTimersByTimeAsync(299);
    });
    expect(searches).toHaveLength(0);
    await act(async () => {
      await vi.advanceTimersByTimeAsync(1);
    });
    expect(searches).toHaveLength(1);
    expect(searches[0]?.url).toContain("q=cr");
    const first = searches[0]?.signal;
    fireEvent.change(medicine, { target: { value: "cro" } });
    expect(first?.aborted).toBe(true);
    await act(async () => {
      await vi.advanceTimersByTimeAsync(299);
    });
    expect(searches).toHaveLength(1);
    await act(async () => {
      await vi.advanceTimersByTimeAsync(1);
    });
    expect(searches).toHaveLength(2);
    expect(searches[1]?.url).toContain("q=cro");
  });

  it("hides Create return without purchases:return", async () => {
    renderPage("staff", ["purchases:read"]);
    fireEvent.click(await screen.findByRole("button", { name: "PUR-001" }));
    expect(screen.getByRole("dialog", { name: "PUR-001 receipt" })).toBeTruthy();
    expect(screen.queryByRole("button", { name: "Create return" })).toBeNull();
  });
});
