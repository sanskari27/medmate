import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { Provider } from "react-redux";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { afterEach, describe, expect, it, vi } from "vitest";
import { createAppStore } from "@/app/store";
import { SESSION_STORAGE_KEY } from "@/constants";
import type { Session } from "@/types";
import { LeadDetailPage } from "./LeadDetailPage";

const session: Session = {
  accessToken: "access",
  refreshToken: "refresh",
  expiresIn: 900,
  account: {
    id: "account-id",
    accountType: "admin",
    phone: "+919876543210",
    displayName: "Ada",
    pharmacyId: null,
    pharmacyRole: null,
    verificationStatus: null,
    rejection: null,
    subtypes: [],
    permissions: [],
    pinSetupRequired: false,
  },
};

const lead = {
  id: "lead-1",
  site: "medmatepharmacy",
  type: "contact",
  status: "new",
  createdAt: "2026-11-14T08:00:00Z",
  name: "Ada",
  phone: "9845012345",
  email: "ada@example.com",
  pharmacyName: null,
  cityPincode: null,
  area: null,
  city: null,
  preferredTime: null,
  monthlySales: null,
  subject: "Order issue",
  message: "Need help",
  source: null,
  notes: null,
  plan: null,
  consent: true,
};

function requestUrl(input: RequestInfo | URL) {
  if (typeof input === "string") return input;
  if (input instanceof URL) return input.toString();
  return input.url;
}

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "content-type": "application/json" },
  });
}

function renderPage() {
  sessionStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify({ session, pinReset: false }));
  return render(
    <Provider store={createAppStore()}>
      <MemoryRouter initialEntries={["/leads/lead-1"]}>
        <Routes>
          <Route path="/leads/:leadId" element={<LeadDetailPage />} />
          <Route path="/leads" element={<div>All leads</div>} />
        </Routes>
      </MemoryRouter>
    </Provider>,
  );
}

afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
  sessionStorage.clear();
});

describe("LeadDetailPage", () => {
  it("shows the stored fields and both status buttons", async () => {
    let status = "new";
    const patches: string[] = [];
    vi.stubGlobal(
      "fetch",
      vi.fn(async (input: RequestInfo | URL, init?: RequestInit) => {
        const request = input instanceof Request ? input : null;
        const url = requestUrl(input);
        const method = (init?.method ?? request?.method ?? "GET").toUpperCase();
        if (url.includes("/api/v1/leads/lead-1") && method === "PATCH") {
          const raw = init?.body ?? (request ? await request.clone().text() : "{}");
          const body = JSON.parse(String(raw || "{}")) as { status?: string };
          if (body.status === "new" || body.status === "contacted") status = body.status;
          patches.push(status);
          return json({ lead: { ...lead, status } });
        }
        if (url.includes("/api/v1/leads/lead-1")) return json({ lead: { ...lead, status } });
        return json({ detail: "Not found" }, 404);
      }),
    );

    renderPage();
    expect(await screen.findByRole("heading", { name: "Ada" })).toBeTruthy();
    expect(screen.getByText("MedMate Pharmacy")).toBeTruthy();
    expect(screen.getByText("Contact")).toBeTruthy();
    expect(screen.getByText("9845012345")).toBeTruthy();
    expect(screen.getByText("ada@example.com")).toBeTruthy();
    expect(screen.getByText("Order issue")).toBeTruthy();
    expect(screen.getByText("Need help")).toBeTruthy();
    expect(screen.getByText("Yes")).toBeTruthy();
    expect(screen.getByRole("button", { name: "New", pressed: true })).toBeTruthy();

    fireEvent.click(screen.getByRole("button", { name: "Contacted" }));
    expect(await screen.findByRole("button", { name: "Contacted", pressed: true })).toBeTruthy();
    expect(patches).toEqual(["contacted"]);

    fireEvent.click(screen.getByRole("button", { name: "New" }));
    expect(await screen.findByRole("button", { name: "New", pressed: true })).toBeTruthy();
    expect(patches).toEqual(["contacted", "new"]);
  });
});
