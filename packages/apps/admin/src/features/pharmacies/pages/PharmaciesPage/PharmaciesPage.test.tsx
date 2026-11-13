import { cleanup, render, screen } from "@testing-library/react";
import { Provider } from "react-redux";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { afterEach, describe, expect, it, vi } from "vitest";
import { createAppStore } from "@/app/store";
import { SESSION_STORAGE_KEY } from "@/constants";
import type { Session } from "@/types";
import { PharmaciesPage } from "./PharmaciesPage";

const session: Session = {
  accessToken: "access",
  refreshToken: "refresh",
  expiresIn: 900,
  account: {
    id: "account-id",
    accountType: "staff",
    phone: "+919876543210",
    displayName: "Faye",
    pharmacyId: null,
    pharmacyRole: null,
    verificationStatus: null,
    rejection: null,
    subtypes: ["finance"],
    permissions: [],
    pinSetupRequired: false,
  },
};

const named = {
  pharmacyId: "named",
  name: "Care Pharmacy",
  phone: "+919111111111",
  status: "approved",
  blockState: "clear",
};

const blank = {
  pharmacyId: "blank",
  name: null,
  phone: "+919222222222",
  status: "incomplete",
  blockState: "blocked",
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
      <MemoryRouter initialEntries={["/pharmacies"]}>
        <Routes>
          <Route path="/pharmacies" element={<PharmaciesPage />} />
          <Route path="/pharmacies/:pharmacyId" element={<div>Opened</div>} />
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

describe("PharmaciesPage", () => {
  it("shows the owner name, phone, status, and block state", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async (input: RequestInfo) => {
        const url = requestUrl(input);
        if (url.includes("/pharmacy-owners")) return json([named, blank]);
        return json({ detail: "Not found" }, 404);
      }),
    );

    renderPage();
    expect(await screen.findByRole("link", { name: "Care Pharmacy" })).toBeTruthy();
    expect(screen.getByText("+919111111111")).toBeTruthy();
    expect(screen.getByText("Approved")).toBeTruthy();
    expect(screen.getByText("Active")).toBeTruthy();
    expect(screen.getByRole("link", { name: "+919222222222" })).toBeTruthy();
    expect(screen.getByText("—")).toBeTruthy();
    expect(screen.getByText("Incomplete")).toBeTruthy();
    expect(screen.getByText("Blocked")).toBeTruthy();
    expect(screen.getByText("page 1 of 1")).toBeTruthy();
  });

  it("says when there are no owners", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async (input: RequestInfo) => {
        const url = requestUrl(input);
        if (url.includes("/pharmacy-owners")) return json([]);
        return json({ detail: "Not found" }, 404);
      }),
    );

    renderPage();
    expect(await screen.findByText("No pharmacy owners yet.")).toBeTruthy();
  });

  it("shows a problem detail and no rows when the list fails", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async (input: RequestInfo) => {
        const url = requestUrl(input);
        if (url.includes("/pharmacy-owners")) {
          return json({ detail: "Pharmacy owners are not available" }, 403);
        }
        return json({ detail: "Not found" }, 404);
      }),
    );

    renderPage();
    expect(await screen.findByText("Pharmacy owners are not available")).toBeTruthy();
    expect(screen.queryByRole("link")).toBeNull();
  });
});
