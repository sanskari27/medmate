import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { Provider } from "react-redux";
import { MemoryRouter, Route, Routes, useParams } from "react-router-dom";
import { afterEach, describe, expect, it, vi } from "vitest";
import { createAppStore } from "@/app/store";
import { SESSION_STORAGE_KEY } from "@/constants";
import type { Session } from "@/types";
import { LeadsPage } from "./LeadsPage";

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

const ada = {
  id: "lead-1",
  site: "nammamedmate",
  type: "contact",
  status: "new",
  name: "Ada",
  phone: null,
  email: "ada@example.com",
  createdAt: "2026-11-14T08:00:00Z",
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

function Opened() {
  const { leadId } = useParams();
  return <div>Opened {leadId}</div>;
}

function renderPage() {
  sessionStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify({ session, pinReset: false }));
  return render(
    <Provider store={createAppStore()}>
      <MemoryRouter initialEntries={["/leads"]}>
        <Routes>
          <Route path="/leads" element={<LeadsPage />} />
          <Route path="/leads/:leadId" element={<Opened />} />
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

describe("LeadsPage", () => {
  it("filters the list, pages it, and opens a row", async () => {
    const urls: string[] = [];
    vi.stubGlobal(
      "fetch",
      vi.fn(async (input: RequestInfo) => {
        const url = requestUrl(input);
        urls.push(url);
        if (!url.includes("/api/v1/leads")) return json({ detail: "Not found" }, 404);
        if (url.includes("page=2")) {
          return json({ leads: [ada], page: 2, size: 25, total: 30 });
        }
        if (url.includes("status=new")) {
          return json({ leads: [ada], page: 1, size: 25, total: 1 });
        }
        return json({
          leads: [ada, { ...ada, id: "lead-2", name: "Nia", status: "contacted" }],
          page: 1,
          size: 25,
          total: 30,
        });
      }),
    );

    renderPage();
    expect(await screen.findByRole("link", { name: "Ada" })).toBeTruthy();
    expect(screen.getByRole("link", { name: "Nia" })).toBeTruthy();
    expect(screen.getByText("page 1 of 2")).toBeTruthy();
    expect(urls.some((url) => url.includes("/api/v1/leads") && url.includes("size=25"))).toBe(true);

    fireEvent.change(screen.getByLabelText("Status"), { target: { value: "new" } });
    await waitFor(() => {
      expect(screen.queryByRole("link", { name: "Nia" })).toBeNull();
    });
    expect(screen.getByRole("link", { name: "Ada" })).toBeTruthy();
    expect(urls.some((url) => url.includes("status=new"))).toBe(true);

    fireEvent.change(screen.getByLabelText("Site"), { target: { value: "nammamedmate" } });
    fireEvent.change(screen.getByLabelText("Form"), { target: { value: "contact" } });
    await waitFor(() => {
      expect(
        urls.some((url) => url.includes("site=nammamedmate") && url.includes("type=contact")),
      ).toBe(true);
    });

    fireEvent.change(screen.getByLabelText("Status"), { target: { value: "" } });
    fireEvent.change(screen.getByLabelText("Site"), { target: { value: "" } });
    fireEvent.change(screen.getByLabelText("Form"), { target: { value: "" } });
    expect(await screen.findByText("page 1 of 2")).toBeTruthy();
    fireEvent.click(screen.getByRole("button", { name: "Next" }));
    await waitFor(() => {
      expect(urls.some((url) => url.includes("page=2"))).toBe(true);
    });

    fireEvent.click(screen.getByRole("link", { name: "Ada" }));
    expect(await screen.findByText("Opened lead-1")).toBeTruthy();
  });

  it("says when no leads are stored", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => json({ leads: [], page: 1, size: 25, total: 0 })),
    );
    renderPage();
    expect(await screen.findByText("No leads yet.")).toBeTruthy();
  });
});
