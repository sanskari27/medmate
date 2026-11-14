import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { Provider } from "react-redux";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { afterEach, describe, expect, it, vi } from "vitest";
import { createAppStore } from "@/app/store";
import { SESSION_STORAGE_KEY } from "@/constants";
import type { Session } from "@/types";
import { PrepSheetPage } from "./PrepSheetPage";

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

const emptyList = {
  list: { id: "list-1", name: "City opening", updatedAt: "2026-11-15T08:00:00Z", lines: [] },
};

const crocin = {
  productId: "DR100",
  productName: "Crocin",
  displayName: null,
  marketerName: "GSK",
  mrp: 25,
};

function requestUrl(input: RequestInfo | URL) {
  if (typeof input === "string") return input;
  if (input instanceof URL) return input.toString();
  return input.url;
}

function requestMethod(input: RequestInfo | URL, init?: RequestInit) {
  if (init?.method) return init.method;
  if (input instanceof Request) return input.method;
  return "GET";
}

async function requestBody(input: RequestInfo | URL, init?: RequestInit) {
  if (typeof init?.body === "string") return init.body;
  if (input instanceof Request) return input.clone().text();
  return "";
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
      <MemoryRouter initialEntries={["/inventory-prep/list-1"]}>
        <Routes>
          <Route path="/inventory-prep/:listId" element={<PrepSheetPage />} />
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

describe("PrepSheetPage", () => {
  it("adds a search hit, keeps focus, saves a blank batch, and deletes the row", async () => {
    const saved: string[] = [];
    vi.stubGlobal(
      "fetch",
      vi.fn(async (input: RequestInfo | URL, init?: RequestInit) => {
        const url = requestUrl(input);
        const method = requestMethod(input, init);
        if (url.includes("/api/search")) return json({ drug: [crocin], fmcg: [] });
        if (method === "PUT") {
          saved.push(await requestBody(input, init));
          return json({
            list: {
              id: "list-1",
              name: "City opening",
              updatedAt: "2026-11-15T08:00:00Z",
              lines: [
                {
                  position: 1,
                  productId: "DR100",
                  productName: "Crocin",
                  batchNo: null,
                  expiry: null,
                  qty: null,
                  free: null,
                  rate: null,
                  mrp: 25,
                  gst: null,
                },
              ],
            },
          });
        }
        if (url.includes("/api/v1/inventory-prep/list-1")) return json(emptyList);
        return json({ detail: "Not found" }, 404);
      }),
    );

    renderPage();
    const search = await screen.findByRole("combobox", { name: "Add a product" });
    fireEvent.change(search, { target: { value: "cr" } });
    fireEvent.click(await screen.findByRole("option", { name: /Crocin/ }));
    expect(await screen.findByRole("rowheader", { name: /Crocin/ })).toBeTruthy();
    expect((search as HTMLInputElement).value).toBe("");
    await waitFor(() => {
      expect(document.activeElement).toBe(search);
    });

    fireEvent.click(screen.getByRole("button", { name: "Save" }));
    await waitFor(() => {
      expect(saved.some((body) => body.includes('"batchNo":null'))).toBe(true);
    });

    fireEvent.click(screen.getByRole("button", { name: "Delete Crocin" }));
    expect(screen.queryByRole("rowheader", { name: /Crocin/ })).toBeNull();
  });

  it("shows an export problem for a saved row", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async (input: RequestInfo | URL, init?: RequestInit) => {
        const url = requestUrl(input);
        const method = requestMethod(input, init);
        if (method === "POST" && url.includes("/export")) {
          return json({ detail: "Row 1: Product was not found" }, 400);
        }
        if (url.includes("/api/v1/inventory-prep/list-1")) {
          return json({
            list: {
              id: "list-1",
              name: "City opening",
              updatedAt: "2026-11-15T08:00:00Z",
              lines: [
                {
                  position: 1,
                  productId: "DR100",
                  productName: "Crocin",
                  batchNo: "B1",
                  expiry: "2027-01",
                  qty: 10,
                  free: 0,
                  rate: 12.5,
                  mrp: 25,
                  gst: 12,
                },
              ],
            },
          });
        }
        return json({ detail: "Not found" }, 404);
      }),
    );

    renderPage();
    expect(await screen.findByRole("rowheader", { name: /Crocin/ })).toBeTruthy();
    fireEvent.click(screen.getByRole("button", { name: "Export CSV" }));
    expect(await screen.findByRole("alert")).toBeTruthy();
    expect(screen.getByRole("alert").textContent).toContain("Row 1: Product was not found");
  });
});
