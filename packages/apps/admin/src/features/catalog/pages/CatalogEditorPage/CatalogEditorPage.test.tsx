import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { Provider } from "react-redux";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { afterEach, describe, expect, it, vi } from "vitest";
import { createAppStore } from "@/app/store";
import { SESSION_STORAGE_KEY } from "@/constants";
import type { Session } from "@/types";
import { CatalogEditorPage } from "./CatalogEditorPage";

const session: Session = {
  accessToken: "access",
  refreshToken: "refresh",
  expiresIn: 900,
  account: {
    id: "account-id",
    accountType: "staff",
    phone: "+919876543210",
    displayName: "Ada",
    pharmacyId: null,
    pharmacyRole: null,
    verificationStatus: null,
    rejection: null,
    subtypes: ["sales"],
    permissions: [],
    pinSetupRequired: false,
  },
};

const stored = {
  productId: "DR100",
  productName: "Crocin",
  displayName: null,
  prescriptionRequired: false,
  ingredients: [{ name: "Paracetamol", strength: "500 mg" }],
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

function renderAt(path: string) {
  sessionStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify({ session, pinReset: false }));
  return render(
    <Provider store={createAppStore()}>
      <MemoryRouter initialEntries={[path]}>
        <Routes>
          <Route path="/catalog/drugs/new" element={<CatalogEditorPage kind="drug" />} />
          <Route path="/catalog/drugs/:productId" element={<CatalogEditorPage kind="drug" />} />
          <Route path="/catalog/fmcg/new" element={<CatalogEditorPage kind="fmcg" />} />
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

describe("CatalogEditorPage", () => {
  it("creates a drug", async () => {
    const bodies: Record<string, unknown>[] = [];
    vi.stubGlobal(
      "fetch",
      vi.fn(async (input: RequestInfo | URL, init?: RequestInit) => {
        const request = input instanceof Request ? input : null;
        const url = requestUrl(input);
        const method = (init?.method ?? request?.method ?? "GET").toUpperCase();
        if (url.includes("/api/v1/catalog/drugs") && method === "POST") {
          const raw = init?.body ?? (request ? await request.clone().text() : "{}");
          bodies.push(JSON.parse(String(raw || "{}")) as Record<string, unknown>);
          return json(
            { drug: [{ ...stored, productId: "DR200", productName: "Zinc" }], fmcg: [] },
            201,
          );
        }
        return json({ detail: "Not found" }, 404);
      }),
    );

    renderAt("/catalog/drugs/new");
    expect(screen.queryByLabelText("Introduction")).toBeNull();
    fireEvent.click(screen.getByRole("button", { name: "Edit details" }));
    expect(await screen.findByLabelText("Introduction")).toBeTruthy();
    fireEvent.click(screen.getByRole("button", { name: "Done" }));
    await waitFor(() => {
      expect(screen.queryByRole("dialog")).toBeNull();
    });
    fireEvent.change(screen.getByLabelText("Product id *"), { target: { value: "DR200" } });
    fireEvent.change(screen.getByLabelText("Product name *"), { target: { value: "Zinc" } });
    fireEvent.click(screen.getByRole("button", { name: "Create product" }));
    await waitFor(() => {
      expect(bodies[0]?.productId).toBe("DR200");
    });
    expect(bodies[0]?.productName).toBe("Zinc");
    expect(bodies[0]?.prescriptionRequired).toBe(false);
    expect(bodies[0]?.displayName).toBeUndefined();
    expect(await screen.findByText("Saved.")).toBeTruthy();
  });

  it("saves a display name and shows a duplicate", async () => {
    const bodies: Record<string, unknown>[] = [];
    vi.stubGlobal(
      "fetch",
      vi.fn(async (input: RequestInfo | URL, init?: RequestInit) => {
        const request = input instanceof Request ? input : null;
        const url = requestUrl(input);
        const method = (init?.method ?? request?.method ?? "GET").toUpperCase();
        if (url.includes("/api/v1/catalog/drugs/DR100") && method === "PUT") {
          const raw = init?.body ?? (request ? await request.clone().text() : "{}");
          const body = JSON.parse(String(raw || "{}")) as Record<string, unknown>;
          bodies.push(body);
          if (body.displayName === "Counter Crocin") {
            return json({ detail: "Product already exists" }, 409);
          }
          return json({ drug: [stored], fmcg: [] });
        }
        if (url.includes("/api/products/DR100")) {
          return json({ drug: [stored], fmcg: [] });
        }
        return json({ detail: "Not found" }, 404);
      }),
    );

    renderAt("/catalog/drugs/DR100");
    const displayName = await screen.findByLabelText("Display name");
    expect((screen.getByLabelText("Product id *") as HTMLInputElement).readOnly).toBe(true);
    fireEvent.change(displayName, { target: { value: "Counter Crocin" } });
    fireEvent.click(screen.getByRole("button", { name: "Save product" }));
    expect(await screen.findByRole("alert")).toBeTruthy();
    expect(screen.getByRole("alert").textContent).toBe("Product already exists");
    expect(bodies[0]?.displayName).toBe("Counter Crocin");
    expect(bodies[0]?.productId).toBe("DR100");
    expect(bodies[0]?.ingredients).toEqual([{ name: "Paracetamol", strength: "500 mg" }]);
    expect(screen.getByText("Paracetamol")).toBeTruthy();
  });

  it("adds and edits a category on the shelf", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => json({ detail: "Not found" }, 404)),
    );

    renderAt("/catalog/fmcg/new");
    const add = screen.getByRole("textbox", { name: "Add category" });
    fireEvent.change(add, { target: { value: "Skin" } });
    fireEvent.keyDown(add, { key: "Enter" });
    expect(screen.queryByRole("dialog")).toBeNull();
    expect(screen.getByText("Skin")).toBeTruthy();

    fireEvent.click(screen.getByRole("button", { name: "Edit Skin" }));
    const editing = screen.getByRole("textbox", { name: "Edit Skin" });
    fireEvent.change(editing, { target: { value: "Bath" } });
    fireEvent.keyDown(editing, { key: "Enter" });
    expect(screen.getByText("Bath")).toBeTruthy();
    expect(screen.queryByText("Skin")).toBeNull();
  });
});
