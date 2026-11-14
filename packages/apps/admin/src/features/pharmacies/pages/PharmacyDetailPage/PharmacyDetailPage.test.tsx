import { cleanup, fireEvent, render, screen, within } from "@testing-library/react";
import { Provider } from "react-redux";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { afterEach, describe, expect, it, vi } from "vitest";
import { createAppStore } from "@/app/store";
import { SESSION_STORAGE_KEY } from "@/constants";
import type { Account, Session } from "@/types";
import { PharmacyDetailPage } from "./PharmacyDetailPage";

const staffAccount: Account = {
  id: "account-id",
  accountType: "staff",
  phone: "+919876543210",
  displayName: "Sam",
  pharmacyId: null,
  pharmacyRole: null,
  verificationStatus: null,
  rejection: null,
  subtypes: ["sales"],
  permissions: [],
  pinSetupRequired: false,
};

const adminAccount: Account = {
  ...staffAccount,
  accountType: "admin",
  subtypes: [],
  displayName: "Ada",
};

function owner(overrides: Record<string, unknown> = {}) {
  return {
    pharmacyId: "pharm-1",
    status: "approved",
    rejection: null,
    phone: "+919876543210",
    name: "Care Pharmacy",
    tagline: null,
    email: "owner@example.com",
    address: "12 Market Road",
    city: "Bengaluru",
    state: "Karnataka",
    pincode: "560001",
    businessTypes: ["Retail Pharmacy"],
    industry: "Pharmacy & Healthcare",
    registrationType: "Proprietorship",
    pharmacyType: "pharmacy",
    gstin: "29ABCDE1234F1Z5",
    pan: "ABCDE1234F",
    drugLicenceNo: "DL-1",
    fssaiNo: "FSSAI-1",
    tradeLicenceNo: "TL-1",
    enableTds: false,
    enableTcs: false,
    pharmacistName: "A. Rao",
    invoicePrefix: "CARE",
    terms: null,
    acceptOnlineOrders: true,
    selfOrderKiosk: false,
    eInvoicing: false,
    looseSelling: true,
    lowStockAlerts: true,
    submittedAt: "2026-11-11T10:00:00Z",
    documents: [],
    blockState: "clear",
    request: null,
    ...overrides,
  };
}

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

function renderDetail(account: Account, body: unknown, next: unknown = body) {
  const session: Session = {
    accessToken: "access",
    refreshToken: "refresh",
    expiresIn: 900,
    account,
  };
  sessionStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify({ session, pinReset: false }));
  const posts: { url: string; body: string }[] = [];
  vi.stubGlobal(
    "fetch",
    vi.fn(async (input: RequestInfo) => {
      const url = requestUrl(input);
      const method = input instanceof Request ? input.method : "GET";
      if (method === "POST" && input instanceof Request) {
        posts.push({ url, body: await input.text() });
        return json(next);
      }
      if (url.includes("/pharmacy-owners/pharm-1")) return json(body);
      return json({ detail: "Not found" }, 404);
    }),
  );
  render(
    <Provider store={createAppStore()}>
      <MemoryRouter initialEntries={["/pharmacies/pharm-1"]}>
        <Routes>
          <Route path="/pharmacies/:pharmacyId" element={<PharmacyDetailPage />} />
        </Routes>
      </MemoryRouter>
    </Provider>,
  );
  return posts;
}

afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
  sessionStorage.clear();
});

describe("PharmacyDetailPage", () => {
  it("shows the stored rejection, extra details, and request time", async () => {
    renderDetail(
      adminAccount,
      owner({
        status: "rejected",
        rejection: { stage: "compliance", comment: "Licence is unreadable" },
        createdAt: "2026-11-01T10:00:00Z",
        extraDetails: [{ label: "Website", value: "care.example" }],
        reviews: [],
        blockHistory: [],
        blockState: "requested",
        request: { id: "req-1", reason: "Missing licence", requestedAt: "2026-11-12T10:00:00Z" },
      }),
    );
    expect(await screen.findByText("pharm-1")).toBeTruthy();
    expect(screen.getByText("Compliance · Licence is unreadable")).toBeTruthy();
    expect(screen.getByText("Website")).toBeTruthy();
    expect(screen.getByText("care.example")).toBeTruthy();
    const times = [...document.querySelectorAll("time")].map((node) =>
      node.getAttribute("datetime"),
    );
    expect(times).toContain("2026-11-12T10:00:00Z");
    expect(screen.getByText("No review decisions.")).toBeTruthy();
    expect(screen.getByText("No closed block requests.")).toBeTruthy();
  });

  it("lets staff request a block and refuses an empty reason", async () => {
    const posts = renderDetail(
      staffAccount,
      owner(),
      owner({
        blockState: "requested",
        request: { id: "req-1", reason: "Missing licence", requestedAt: "2026-11-12T10:00:00Z" },
      }),
    );
    const button = await screen.findByRole("button", { name: "Request block" });
    expect((button as HTMLButtonElement).disabled).toBe(true);
    expect(screen.queryByRole("button", { name: "Block account" })).toBeNull();
    fireEvent.change(screen.getByRole("textbox", { name: "Reason" }), {
      target: { value: "  Missing licence  " },
    });
    fireEvent.click(screen.getByRole("button", { name: "Request block" }));
    const dialog = await screen.findByRole("dialog", { name: "Request a block?" });
    expect(posts).toHaveLength(0);
    fireEvent.click(within(dialog).getByRole("button", { name: "Cancel" }));
    expect(screen.queryByRole("dialog")).toBeNull();
    fireEvent.click(screen.getByRole("button", { name: "Request block" }));
    fireEvent.click(
      within(screen.getByRole("dialog")).getByRole("button", { name: "Request block" }),
    );
    expect(await screen.findByText("Waiting for admin review.")).toBeTruthy();
    expect(posts).toHaveLength(1);
    expect(posts[0]?.url).toContain("/pharmacy-owners/pharm-1/block-requests");
    expect(JSON.parse(posts[0]?.body ?? "{}")).toEqual({ reason: "Missing licence" });
    expect(screen.getByText("Block requested")).toBeTruthy();
  });

  it("lets platform admin approve a request", async () => {
    const posts = renderDetail(
      adminAccount,
      owner({
        blockState: "requested",
        request: { id: "req-1", reason: "Missing licence", requestedAt: "2026-11-12T10:00:00Z" },
      }),
      owner({ blockState: "blocked", request: null }),
    );
    expect(await screen.findByText("Missing licence")).toBeTruthy();
    expect(screen.queryByRole("button", { name: "Request block" })).toBeNull();
    expect(screen.queryByRole("switch")).toBeNull();
    fireEvent.click(screen.getByRole("button", { name: "Approve block" }));
    fireEvent.click(
      within(await screen.findByRole("dialog", { name: "Approve this block?" })).getByRole(
        "button",
        { name: "Approve block" },
      ),
    );
    expect(await screen.findByRole("switch", { name: "Unblock account" })).toBeTruthy();
    expect(posts[0]?.url).toContain("/block-requests/req-1/decision");
    expect(JSON.parse(posts[0]?.body ?? "{}")).toEqual({ decision: "approve" });
    expect(screen.getByText("Blocked")).toBeTruthy();
  });

  it("lets platform admin block directly", async () => {
    const posts = renderDetail(
      adminAccount,
      owner(),
      owner({ blockState: "blocked", request: null }),
    );
    const toggle = await screen.findByRole("switch", { name: "Block account" });
    expect(toggle.getAttribute("aria-checked")).toBe("false");
    fireEvent.click(toggle);
    expect(toggle.getAttribute("aria-checked")).toBe("false");
    expect(posts).toHaveLength(0);
    fireEvent.click(
      within(screen.getByRole("dialog", { name: "Block this account?" })).getByRole("button", {
        name: "Block account",
      }),
    );
    expect(await screen.findByRole("switch", { name: "Unblock account" })).toBeTruthy();
    expect(posts[0]?.url).toContain("/pharmacy-owners/pharm-1/block");
    expect(posts[0]?.url).not.toContain("block-requests");
    expect(screen.getByText("Blocked")).toBeTruthy();
  });

  it("lets platform admin unblock", async () => {
    const posts = renderDetail(
      adminAccount,
      owner({ blockState: "blocked", request: null }),
      owner({ blockState: "clear", request: null }),
    );
    fireEvent.click(await screen.findByRole("switch", { name: "Unblock account" }));
    fireEvent.click(
      within(screen.getByRole("dialog", { name: "Unblock this account?" })).getByRole("button", {
        name: "Unblock account",
      }),
    );
    expect(await screen.findByRole("switch", { name: "Block account" })).toBeTruthy();
    expect(posts[0]?.url).toContain("/pharmacy-owners/pharm-1/unblock");
    expect(screen.getByText("Active")).toBeTruthy();
  });
});
