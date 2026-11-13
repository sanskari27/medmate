import { cleanup, render, screen, waitFor } from "@testing-library/react";
import { Provider } from "react-redux";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { afterEach, describe, expect, it, vi } from "vitest";
import { createAppStore } from "@/app/store";
import { writeSession } from "@/services/storage";
import type { Session } from "@/types";
import type { ReportBody } from "../../model";
import { ReportPage } from "./ReportPage";

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
    permissions: ["reports:read"],
    pinSetupRequired: false,
  },
};

const gstr: ReportBody = {
  id: "gstr1",
  name: "GSTR-1 (Sales)",
  description: "Outward supplies, slab-wise",
  from: "2026-11-01",
  to: "2026-11-30",
  label: "01 Nov 2026 – 30 Nov 2026",
  columns: [
    { key: "k", label: "GST slab", money: false, num: false },
    { key: "qty", label: "Qty", money: false, num: true },
    { key: "total", label: "Total", money: true, num: false },
  ],
  rows: [["18%", 2, "236.00"]],
  totals: ["TOTAL", 2, "236.00"],
  note: null,
};

const empty: ReportBody = {
  ...gstr,
  rows: [],
  totals: null,
  note: "No outward supplies in this period.",
};

const low: ReportBody = {
  id: "low-stock",
  name: "Low Stock Summary",
  description: "Items at/under reorder level",
  from: "2026-11-01",
  to: "2026-11-30",
  label: "As of today",
  columns: [{ key: "item", label: "Item", money: false, num: false }],
  rows: [],
  totals: null,
  note: "No items at or below reorder level.",
};

function renderAt(path: string, permissions: string[], body: ReportBody) {
  writeSession({ ...session, account: { ...session.account, permissions } });
  vi.stubGlobal(
    "fetch",
    vi.fn(async () => {
      return new Response(JSON.stringify(body), {
        status: 200,
        headers: { "content-type": "application/json" },
      });
    }),
  );
  return render(
    <Provider store={createAppStore()}>
      <MemoryRouter initialEntries={[path]}>
        <Routes>
          <Route path="/reports/:reportId" element={<ReportPage />} />
        </Routes>
      </MemoryRouter>
    </Provider>,
  );
}

afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
});

describe("ReportPage", () => {
  it("renders a GSTR-1 row and the empty note", async () => {
    renderAt("/reports/gstr1", ["reports:read", "reports:export"], gstr);
    expect(await screen.findByText("18%")).toBeTruthy();
    expect(screen.getAllByText("₹236.00").length).toBeGreaterThan(0);
    expect(screen.getByRole("button", { name: "Excel" })).toBeTruthy();
    expect(screen.getByRole("button", { name: "This month" })).toBeTruthy();

    cleanup();
    renderAt("/reports/gstr1", ["reports:read"], empty);
    expect(await screen.findByText("No outward supplies in this period.")).toBeTruthy();
    expect(screen.queryByRole("button", { name: "Excel" })).toBeNull();
  });

  it("hides the period on Low Stock", async () => {
    renderAt("/reports/low-stock", ["reports:read"], low);
    expect(await screen.findByText("As of today")).toBeTruthy();
    expect(screen.queryByRole("button", { name: "This month" })).toBeNull();
    await waitFor(() => expect(screen.getByText("No items at or below reorder level.")).toBeTruthy());
  });

  it("says an unknown report is not available", () => {
    renderAt("/reports/balance-sheet", ["reports:read"], gstr);
    expect(screen.getByText("This report is not available.")).toBeTruthy();
  });
});
