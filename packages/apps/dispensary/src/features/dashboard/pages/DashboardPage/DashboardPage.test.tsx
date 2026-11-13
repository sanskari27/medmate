import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { Provider } from "react-redux";
import { MemoryRouter } from "react-router-dom";
import { afterEach, describe, expect, it, vi } from "vitest";
import { createAppStore } from "@/app/store";
import { writeSession } from "@/services/storage";
import type { Session } from "@/types";
import type { DashboardSnapshot } from "../../model";
import { DashboardPage } from "./DashboardPage";

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
    permissions: [],
    pinSetupRequired: false,
  },
};

const bucket = {
  label: "Fri",
  cash: "0.00",
  credit: "0.00",
  cashBills: 0,
  creditBills: 0,
  sales: "0.00",
  purchases: "0.00",
};

function snapshot(filled: boolean): DashboardSnapshot {
  return {
    range: "7d",
    from: "2026-11-07",
    to: "2026-11-13",
    today: {
      netSales: filled ? "60.00" : "0.00",
      bills: filled ? 2 : 0,
      averageBill: filled ? "30.00" : "0.00",
      units: filled ? 2 : 0,
      cash: filled ? "30.00" : "0.00",
      credit: filled ? "30.00" : "0.00",
      spark: filled
        ? ["0.00", "0.00", "0.00", "0.00", "0.00", "0.00", "60.00"]
        : Array(7).fill("0.00"),
      returns: filled ? "4.00" : "0.00",
      returnCount: filled ? 1 : 0,
    },
    month: {
      netSales: filled ? "60.00" : "0.00",
      purchases: filled ? "80.00" : "0.00",
      expenses: filled ? "15.00" : "0.00",
    },
    dues: { bills: filled ? 1 : 0, outstanding: filled ? "20.00" : "0.00" },
    stock: {
      low: filled ? 1 : 0,
      expiring: filled ? 1 : 0,
      out: filled ? 1 : 0,
      cost: filled ? "40.00" : "0.00",
      retail: filled ? "90.00" : "0.00",
      attention: filled ? [{ name: "Crocin Advance", onHand: 7, reorder: 20 }] : [],
      expiringSoon: filled
        ? [
            {
              name: "Old Syrup",
              batchNo: "B9",
              expiry: "2026-10",
              qty: 2,
              months: -1,
              expired: true,
            },
          ]
        : [],
    },
    recent: filled
      ? [{ number: "INV-2", patient: "Beena", payMode: "credit", payable: "30.00" }]
      : [],
    window: {
      buckets: [
        filled
          ? {
              ...bucket,
              cash: "30.00",
              credit: "30.00",
              cashBills: 1,
              creditBills: 1,
              sales: "60.00",
              purchases: "10.00",
            }
          : bucket,
      ],
      profit: filled
        ? { taxable: "53.58", cogs: "20.00", gross: "33.58" }
        : { taxable: "0.00", cogs: "0.00", gross: "0.00" },
      expenses: filled ? [{ category: "Rent Expense", amount: "10.00" }] : [],
      collected: filled
        ? { cash: "30.00", upi: "10.00", card: "0.00" }
        : { cash: "0.00", upi: "0.00", card: "0.00" },
      topSellers: filled ? [{ name: "Crocin Advance", qty: 2, revenue: "60.00" }] : [],
      returns: filled ? "12.00" : "0.00",
      margin: filled ? "62.67" : "0.00",
    },
  };
}

function renderPage(body: DashboardSnapshot) {
  writeSession(session);
  const requested: string[] = [];
  vi.stubGlobal(
    "fetch",
    vi.fn(async (input: RequestInfo | URL, init?: RequestInit) => {
      const request = input instanceof Request ? input : new Request(input, init);
      requested.push(`${request.method} ${request.url}`);
      return new Response(JSON.stringify(body), {
        status: 200,
        headers: { "content-type": "application/json" },
      });
    }),
  );
  render(
    <Provider store={createAppStore()}>
      <MemoryRouter>
        <DashboardPage />
      </MemoryRouter>
    </Provider>,
  );
  return requested;
}

afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
  sessionStorage.clear();
});

describe("DashboardPage", () => {
  it("shows today's figures and asks again when the range changes", async () => {
    const requested = renderPage(snapshot(true));
    expect(await screen.findByText("Today's sales")).toBeTruthy();
    expect(screen.getByText(/Good (morning|afternoon|evening), Ada/)).toBeTruthy();
    expect(screen.getByText("This month")).toBeTruthy();
    expect(screen.getAllByText("₹60.00").length).toBeGreaterThan(0);
    expect(screen.getByText("Bills today")).toBeTruthy();
    expect(screen.getByText("Dues to collect")).toBeTruthy();
    expect(screen.getByText("Purchases this month")).toBeTruthy();
    expect(screen.getByText("₹80.00")).toBeTruthy();
    expect(screen.getByText("Expenses this month")).toBeTruthy();
    expect(screen.getByText("Returns today")).toBeTruthy();
    expect(screen.getByText("1 returns")).toBeTruthy();
    expect(screen.getByText("Stock at cost")).toBeTruthy();
    expect(screen.getByText("Retail ₹90.00")).toBeTruthy();
    expect(screen.getByText("62.67%")).toBeTruthy();
    expect(screen.getAllByText("₹20.00").length).toBeGreaterThan(0);
    expect(screen.getAllByText("Crocin Advance").length).toBeGreaterThan(0);
    expect(screen.getByText("Expired")).toBeTruthy();
    expect(screen.getByText("INV-2")).toBeTruthy();
    expect(screen.getAllByText("Gross profit").length).toBeGreaterThan(0);
    expect(screen.getAllByText("₹33.58").length).toBeGreaterThan(0);
    expect(screen.getByText("Rent Expense")).toBeTruthy();
    expect(screen.queryByRole("link")).toBeNull();
    await waitFor(() => expect(requested.some((url) => url.includes("range=7d"))).toBe(true));
    fireEvent.click(screen.getByRole("button", { name: "30D" }));
    await waitFor(() => expect(requested.some((url) => url.includes("range=30d"))).toBe(true));
  });

  it("shows the empty copy when nothing has been posted", async () => {
    renderPage(snapshot(false));
    expect(await screen.findByText("All clear")).toBeTruthy();
    expect(screen.getByText("No pending stock alerts.")).toBeTruthy();
    expect(screen.getByText("No medicines expiring in the next 4 months.")).toBeTruthy();
    expect(screen.getByText("No sales yet in this period.")).toBeTruthy();
    expect(screen.getByText("No bills yet.")).toBeTruthy();
    expect(screen.getByText("No sales in this period.")).toBeTruthy();
    expect(screen.getByText("No expenses recorded in this period.")).toBeTruthy();
    expect(screen.getByText("No activity in this period.")).toBeTruthy();
    expect(screen.queryByRole("link")).toBeNull();
  });
});
