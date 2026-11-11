import { cleanup, fireEvent, render, screen, within } from "@testing-library/react";
import { Provider } from "react-redux";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { afterEach, describe, expect, it, vi } from "vitest";
import { createAppStore } from "@/app/store";
import { SESSION_STORAGE_KEY } from "@/constants";
import type { Account, Session } from "@/types";
import { ReviewDetailPage } from "./ReviewDetailPage";
import { ReviewsPage } from "../ReviewsPage";

const adminAccount: Account = {
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
};

const complianceAccount: Account = {
  ...adminAccount,
  accountType: "staff",
  subtypes: ["compliance"],
  displayName: "Nia",
};

const application = {
  pharmacyId: "pharm-1",
  status: "pending_compliance",
  rejection: null,
  phone: "+919876543210",
  name: "Shree Medicals",
  tagline: null,
  email: "owner@example.com",
  address: "12 Market Road",
  city: "Bengaluru",
  state: "Karnataka",
  pincode: "560001",
  businessTypes: ["Retail Pharmacy"],
  industry: "Pharmacy & Healthcare",
  registrationType: "Proprietorship",
  pharmacyType: "Retail",
  gstin: "29ABCDE1234F1Z5",
  pan: "ABCDE1234F",
  drugLicenceNo: "DL-1",
  fssaiNo: "11223344556677",
  tradeLicenceNo: "TL-1",
  enableTds: false,
  enableTcs: false,
  pharmacistName: "A. Rao",
  invoicePrefix: "SHREE",
  terms: null,
  acceptOnlineOrders: false,
  selfOrderKiosk: false,
  eInvoicing: false,
  looseSelling: false,
  lowStockAlerts: true,
  submittedAt: "2026-11-11T10:00:00Z",
  documents: [
    { slot: "gst", contentType: "image/jpeg", url: "https://files.example/gst.jpg" },
    { slot: "pan", contentType: "application/pdf", url: "/pharmacies/pharm-1/documents/pan" },
  ],
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

function renderDetail(account: Account, body: unknown = application) {
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
      if (url.includes("-decision")) {
        posts.push({ url, body: typeof input === "string" ? "" : await input.text() });
        return json({ pharmacyId: "pharm-1", status: "pending_admin" });
      }
      if (url.includes("status=pending_")) return json([]);
      if (url.includes("/documents/gst")) {
        return json({ detail: "Document was not found" }, 404);
      }
      if (url.includes("/documents/pan")) {
        const headers = input instanceof Request ? input.headers : new Headers();
        expect(headers.get("authorization")).toBe("Bearer access");
        return new Response(new Uint8Array([1, 2, 3]), {
          headers: { "content-type": "application/pdf" },
        });
      }
      if (url.includes("/pharmacy-applications/pharm-1")) return json(body);
      return json({ detail: "Not found" }, 404);
    }),
  );
  render(
    <Provider store={createAppStore()}>
      <MemoryRouter initialEntries={["/reviews/pharm-1"]}>
        <Routes>
          <Route path="/reviews" element={<ReviewsPage />} />
          <Route path="/reviews/:pharmacyId" element={<ReviewDetailPage />} />
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

describe("ReviewDetailPage", () => {
  it("shows the submitted fields and the first file", async () => {
    renderDetail(adminAccount);
    expect(await screen.findByRole("heading", { name: "Shree Medicals" })).toBeTruthy();
    expect(screen.getByText("29ABCDE1234F1Z5")).toBeTruthy();
    expect(screen.getByText("Retail Pharmacy")).toBeTruthy();
    expect(screen.getAllByText("—").length).toBeGreaterThan(0);
    const preview = screen.getByRole("img", { name: "GST certificate" });
    expect(preview.getAttribute("src")).toBe("https://files.example/gst.jpg");
  });

  it("lets compliance read a final review without deciding", async () => {
    renderDetail(complianceAccount, { ...application, status: "pending_admin" });
    expect(await screen.findByRole("heading", { name: "Shree Medicals" })).toBeTruthy();
    expect(screen.getByText("Final review is with admin.")).toBeTruthy();
    expect(screen.queryByRole("button", { name: "Approve" })).toBeNull();
    expect(screen.queryByRole("button", { name: "Reject" })).toBeNull();
  });

  it("posts the compliance decision and returns to the list", async () => {
    const posts = renderDetail(adminAccount);
    expect(await screen.findByRole("button", { name: "Approve" })).toBeTruthy();
    fireEvent.click(screen.getByRole("button", { name: "Approve" }));
    const dialog = await screen.findByRole("dialog", { name: "Approve this application?" });
    expect(posts).toHaveLength(0);
    fireEvent.click(within(dialog).getByRole("button", { name: "Cancel" }));
    expect(screen.queryByRole("dialog")).toBeNull();
    expect(posts).toHaveLength(0);
    fireEvent.click(screen.getByRole("button", { name: "Approve" }));
    fireEvent.click(within(screen.getByRole("dialog")).getByRole("button", { name: "Approve" }));
    expect(await screen.findByText("No applications are waiting for review.")).toBeTruthy();
    expect(posts).toHaveLength(1);
    expect(posts[0]?.url).toContain("compliance-decision");
    expect(JSON.parse(posts[0]?.body ?? "{}")).toEqual({ decision: "approve" });
  });

  it("posts the admin decision from final review", async () => {
    const posts = renderDetail(adminAccount, { ...application, status: "pending_admin" });
    expect(await screen.findByRole("button", { name: "Approve" })).toBeTruthy();
    fireEvent.click(screen.getByRole("button", { name: "Approve" }));
    fireEvent.click(
      within(await screen.findByRole("dialog", { name: "Approve this application?" })).getByRole(
        "button",
        { name: "Approve" },
      ),
    );
    expect(await screen.findByText("No applications are waiting for review.")).toBeTruthy();
    expect(posts[0]?.url).toContain("admin-decision");
    expect(JSON.parse(posts[0]?.body ?? "{}")).toEqual({ decision: "approve" });
  });

  it("does not reject until a comment is entered", async () => {
    const posts = renderDetail(adminAccount);
    expect(await screen.findByRole("button", { name: "Reject" })).toBeTruthy();
    fireEvent.click(screen.getByRole("button", { name: "Reject" }));
    fireEvent.click(screen.getByRole("button", { name: "Reject application" }));
    expect(screen.getByText("A comment is required.")).toBeTruthy();
    expect(posts).toHaveLength(0);
    fireEvent.change(screen.getByLabelText("Rejection comment"), {
      target: { value: "Missing seal" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Reject application" }));
    const dialog = await screen.findByRole("dialog", { name: "Reject this application?" });
    expect(posts).toHaveLength(0);
    fireEvent.click(within(dialog).getByRole("button", { name: "Reject application" }));
    expect(await screen.findByText("No applications are waiting for review.")).toBeTruthy();
    expect(JSON.parse(posts[0]?.body ?? "{}")).toEqual({
      decision: "reject",
      comment: "Missing seal",
    });
    expect(posts[0]?.url).toContain("compliance-decision");
  });

  it("shows the problem detail when a file cannot be read", async () => {
    renderDetail(adminAccount, {
      ...application,
      documents: [
        {
          slot: "gst",
          contentType: "image/jpeg",
          url: "/pharmacies/pharm-1/documents/gst",
        },
      ],
    });
    expect(await screen.findByText("Document was not found")).toBeTruthy();
  });

  it("loads a stored file with the session bearer", async () => {
    renderDetail(adminAccount);
    expect(await screen.findByRole("img", { name: "GST certificate" })).toBeTruthy();
    fireEvent.click(screen.getByRole("button", { name: "PAN card" }));
    expect(await screen.findByTitle("PAN card")).toBeTruthy();
  });
});
