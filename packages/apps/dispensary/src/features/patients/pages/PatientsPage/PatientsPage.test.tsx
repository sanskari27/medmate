import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { Provider } from "react-redux";
import { MemoryRouter, Route, Routes, useSearchParams } from "react-router-dom";
import { afterEach, describe, expect, it, vi } from "vitest";
import { createAppStore } from "@/app/store";
import { writeSession } from "@/services/storage";
import type { Session } from "@/types";
import { PatientsPage } from "./PatientsPage";

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
    permissions: ["patients:read", "patients:update"],
    pinSetupRequired: false,
  },
};

const list = {
  patients: [
    {
      phone: "9886012345",
      name: "Ada",
      orders: 1,
      spent: "24.00",
      units: 1,
      lastAt: "2026-11-13T09:00:00Z",
      rx: false,
      points: 0,
      tier: "New",
      segments: ["credit", "new"],
      creditOutstanding: "24.00",
      daysSince: 0,
    },
  ],
  summary: {
    named: 1,
    lifetimeSales: "24.00",
    repeat: 0,
    chronic: 0,
    creditOutstanding: "24.00",
    active30: 1,
    atRisk: 0,
    refillsDue: 0,
    loyaltyPoints: 0,
    avgRating: null,
  },
  aging: [
    { key: "cur", label: "0–30 days", amount: "24.00", count: 1 },
    { key: "d60", label: "31–60 days", amount: "0.00", count: 0 },
    { key: "d60p", label: "60+ days", amount: "0.00", count: 0 },
  ],
  page: 1,
  size: 25,
  total: 1,
};

const detail = {
  patient: {
    ...list.patients[0],
    firstAt: "2026-11-13T09:00:00Z",
    availablePoints: 0,
    given: "24.00",
    repaid: "0.00",
    outstanding: "24.00",
    profile: {
      age: null,
      gender: null,
      bloodGroup: null,
      dob: null,
      address: null,
      conditions: null,
      allergies: null,
      note: null,
      consent: false,
    },
    purchases: [
      {
        number: "INV-0001",
        soldAt: "2026-11-13T09:00:00Z",
        payable: "24.00",
        payMode: "credit",
        units: 1,
      },
    ],
    ledger: [
      {
        at: "2026-11-13T10:00:00Z",
        kind: "repayment",
        label: "Repayment · UPI",
        amount: "10.00",
        ref: "CR-001",
      },
      {
        at: "2026-11-13T09:00:00Z",
        kind: "debit",
        label: "Credit bill",
        amount: "24.00",
        ref: "INV-0001",
      },
    ],
    reminders: [],
    feedback: [],
    redemptions: [],
  },
};

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "content-type": "application/json" },
  });
}

function renderPage(permissions: string[]) {
  writeSession({ ...session, account: { ...session.account, permissions } });
  const store = createAppStore();
  vi.stubGlobal(
    "fetch",
    vi.fn(async (input: RequestInfo | URL, init?: RequestInit) => {
      const url = String(input instanceof Request ? input.url : input);
      const method = input instanceof Request ? input.method : (init?.method ?? "GET");
      if (url.includes("/repayments") && method === "POST")
        return json({ repayment: { code: "R-1" } }, 201);
      if (url.includes("/pharmacy/patients/9886012345")) return json(detail);
      if (url.includes("/pharmacy/patients/export")) return json({ patients: list.patients });
      if (url.includes("/pharmacy/patients")) return json(list);
      if (url.includes("/pharmacy/crm/"))
        return json({ campaigns: [], reminders: [], feedback: [], leaders: [] });
      return json({ detail: "Not found" }, 404);
    }),
  );
  render(
    <Provider store={store}>
      <MemoryRouter initialEntries={["/patients"]}>
        <Routes>
          <Route path="/patients" element={<PatientsPage />} />
          <Route path="/billing" element={<div>Billing counter</div>} />
          <Route path="/sales" element={<SalesStub />} />
        </Routes>
      </MemoryRouter>
    </Provider>,
  );
  return store;
}

afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
  sessionStorage.clear();
});

function SalesStub() {
  const [params] = useSearchParams();
  return <div>Sales search {params.get("q")}</div>;
}

describe("PatientsPage", () => {
  it("opens credit and sends history to sales", async () => {
    renderPage(["patients:read", "patients:update"]);
    expect(await screen.findByText("Ada")).toBeTruthy();
    expect(screen.queryByRole("button", { name: "Profile for Ada" })).toBeNull();
    fireEvent.click(screen.getByRole("button", { name: "Credit for Ada" }));
    expect(await screen.findByRole("dialog", { name: "Credit for Ada" })).toBeTruthy();
    expect(screen.getByText("Credit given")).toBeTruthy();
    expect(screen.getByText("Outstanding")).toBeTruthy();
    expect(screen.getByText("Credit bill")).toBeTruthy();
    expect(screen.getByText("Repayment · UPI")).toBeTruthy();
    expect(screen.getByRole("button", { name: /Collect/ })).toBeTruthy();
    fireEvent.click(screen.getByRole("button", { name: "Close" }));
    fireEvent.click(screen.getByRole("button", { name: "History for Ada" }));
    expect(screen.getByText("Sales search 9886012345")).toBeTruthy();
  });

  it("sends Bill to the counter with the name and phone filled", async () => {
    const store = renderPage(["patients:read", "patients:update"]);
    expect(await screen.findByText("Ada")).toBeTruthy();
    fireEvent.click(screen.getByRole("button", { name: "Bill for Ada" }));
    expect(screen.getByText("Billing counter")).toBeTruthy();
    expect(store.getState().billing.patientName).toBe("Ada");
    expect(store.getState().billing.patientPhone).toBe("9886012345");
  });

  it("clears the repayment amount after a collection", async () => {
    renderPage(["patients:read", "patients:update"]);
    expect(await screen.findByText("Ada")).toBeTruthy();
    fireEvent.click(screen.getByRole("button", { name: "Credit for Ada" }));
    const amount = await screen.findByRole("textbox", { name: "Repayment amount" });
    expect((amount as HTMLInputElement).value).toBe("24.00");
    fireEvent.click(screen.getByRole("button", { name: /Collect/ }));
    await waitFor(() => {
      expect((amount as HTMLInputElement).value).toBe("");
    });
  });

  it("hides Excel and Collect without patients:update", async () => {
    renderPage(["patients:read"]);
    expect(await screen.findByText("Ada")).toBeTruthy();
    expect(screen.queryByRole("button", { name: "Excel" })).toBeNull();
    fireEvent.click(screen.getByRole("button", { name: "Credit for Ada" }));
    expect(await screen.findByRole("dialog", { name: "Credit for Ada" })).toBeTruthy();
    expect(screen.queryByRole("button", { name: /Collect/ })).toBeNull();
  });
});
