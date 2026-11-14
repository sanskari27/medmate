import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { Provider } from "react-redux";
import { MemoryRouter, Route, Routes, useParams } from "react-router-dom";
import { afterEach, describe, expect, it, vi } from "vitest";
import { createAppStore } from "@/app/store";
import { SESSION_STORAGE_KEY } from "@/constants";
import type { Session } from "@/types";
import { PrepListPage } from "./PrepListPage";

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

function Opened() {
  const { listId } = useParams();
  return <div>Opened {listId}</div>;
}

function renderPage() {
  sessionStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify({ session, pinReset: false }));
  return render(
    <Provider store={createAppStore()}>
      <MemoryRouter initialEntries={["/inventory-prep"]}>
        <Routes>
          <Route path="/inventory-prep" element={<PrepListPage />} />
          <Route path="/inventory-prep/:listId" element={<Opened />} />
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

describe("PrepListPage", () => {
  it("creates a list, shows an empty account, and opens a row", async () => {
    const bodies: string[] = [];
    vi.stubGlobal(
      "fetch",
      vi.fn(async (input: RequestInfo | URL, init?: RequestInit) => {
        const url = requestUrl(input);
        const method = requestMethod(input, init);
        if (method === "POST" && url.includes("/api/v1/inventory-prep")) {
          bodies.push(await requestBody(input, init));
          return json({
            list: {
              id: "list-1",
              name: "City opening",
              lineCount: 0,
              updatedAt: "2026-11-15T08:00:00Z",
            },
          });
        }
        if (url.includes("/api/v1/inventory-prep")) {
          return json({
            lists: [
              {
                id: "list-9",
                name: "Ward stock",
                lineCount: 4,
                updatedAt: "2026-11-15T08:00:00Z",
              },
            ],
          });
        }
        return json({ detail: "Not found" }, 404);
      }),
    );

    renderPage();
    expect(await screen.findByRole("link", { name: "Ward stock" })).toBeTruthy();
    fireEvent.click(screen.getByRole("link", { name: "Ward stock" }));
    expect(await screen.findByText("Opened list-9")).toBeTruthy();
    cleanup();

    vi.stubGlobal(
      "fetch",
      vi.fn(async (input: RequestInfo | URL, init?: RequestInit) => {
        const url = requestUrl(input);
        const method = requestMethod(input, init);
        if (method === "POST") {
          bodies.push(await requestBody(input, init));
          return json({
            list: {
              id: "list-1",
              name: "City opening",
              lineCount: 0,
              updatedAt: "2026-11-15T08:00:00Z",
            },
          });
        }
        if (url.includes("/api/v1/inventory-prep")) return json({ lists: [] });
        return json({ detail: "Not found" }, 404);
      }),
    );
    renderPage();
    expect(await screen.findByText("No lists yet.")).toBeTruthy();
    fireEvent.change(screen.getByLabelText("Name"), { target: { value: "City opening" } });
    fireEvent.click(screen.getByRole("button", { name: "Create" }));
    expect(await screen.findByText("Opened list-1")).toBeTruthy();
    expect(bodies.some((body) => body.includes("City opening"))).toBe(true);
  });
});
