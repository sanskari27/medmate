import { cleanup, fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import { Provider } from "react-redux";
import { MemoryRouter, Route, Routes, useParams } from "react-router-dom";
import { afterEach, describe, expect, it, vi } from "vitest";
import { createAppStore } from "@/app/store";
import { SESSION_STORAGE_KEY } from "@/constants";
import type { Session } from "@/types";
import { CatalogPage } from "./CatalogPage";

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

const crocin = {
  productId: "DR100",
  productName: "Crocin",
  displayName: null,
  marketerName: "GSK",
  medicineType: "allopathy",
  productForm: "Tablet",
  mrp: 25,
  prescriptionRequired: false,
  package: "Strip",
  qtyAmount: null,
  qtyUnit: null,
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
  const { productId } = useParams();
  return <div>Opened {productId}</div>;
}

function renderPage() {
  sessionStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify({ session, pinReset: false }));
  return render(
    <Provider store={createAppStore()}>
      <MemoryRouter initialEntries={["/catalog"]}>
        <Routes>
          <Route path="/catalog" element={<CatalogPage />} />
          <Route path="/catalog/drugs/:productId" element={<Opened />} />
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

describe("CatalogPage", () => {
  it("filters both catalogs, pages them, and opens a row", async () => {
    const urls: string[] = [];
    vi.stubGlobal(
      "fetch",
      vi.fn(async (input: RequestInfo) => {
        const url = requestUrl(input);
        urls.push(url);
        if (!url.includes("/api/v1/catalog")) return json({ detail: "Not found" }, 404);
        if (url.includes("page=2")) {
          return json({
            drug: { items: [crocin], page: 2, size: 25, total: 30 },
            fmcg: { items: [], page: 2, size: 25, total: 0 },
          });
        }
        if (url.includes("kind=drug")) {
          return json({
            drug: { items: [crocin], page: 1, size: 25, total: 1 },
            fmcg: { items: [], page: 1, size: 25, total: 0 },
          });
        }
        return json({
          drug: { items: [crocin], page: 1, size: 25, total: 30 },
          fmcg: { items: [], page: 1, size: 25, total: 0 },
        });
      }),
    );

    renderPage();
    expect(await screen.findByRole("link", { name: "Crocin" })).toBeTruthy();
    expect(screen.getByText("No display name")).toBeTruthy();
    expect(screen.getByText("No FMCG products match.")).toBeTruthy();
    expect(screen.getByText("Drugs · 30")).toBeTruthy();
    expect(screen.getByText("page 1 of 2")).toBeTruthy();
    expect(urls.some((url) => url.includes("/api/v1/catalog") && url.includes("size=25"))).toBe(
      true,
    );

    fireEvent.click(screen.getByRole("button", { name: "Next" }));
    await waitFor(() => {
      expect(urls.some((url) => url.includes("page=2"))).toBe(true);
    });

    expect(screen.queryByLabelText("Display name")).toBeNull();
    fireEvent.change(screen.getByLabelText("Kind"), { target: { value: "drug" } });
    fireEvent.click(screen.getByRole("button", { name: "Filters" }));
    const filters = await screen.findByRole("dialog", { name: "Filters" });
    fireEvent.change(within(filters).getByLabelText("Display name"), {
      target: { value: "missing" },
    });
    fireEvent.change(screen.getByLabelText("Text"), { target: { value: "crocin" } });
    await waitFor(() => {
      expect(
        urls.some(
          (url) =>
            url.includes("kind=drug") &&
            url.includes("displayName=missing") &&
            url.includes("q=crocin") &&
            url.includes("page=1"),
        ),
      ).toBe(true);
    });

    fireEvent.click(screen.getByRole("link", { name: "Crocin" }));
    expect(await screen.findByText("Opened DR100")).toBeTruthy();
  });

  it("sends the catalog text once, after typing pauses", async () => {
    const urls: string[] = [];
    vi.stubGlobal(
      "fetch",
      vi.fn(async (input: RequestInfo) => {
        const url = requestUrl(input);
        urls.push(url);
        return json({
          drug: { items: [crocin], page: 1, size: 25, total: 1 },
          fmcg: { items: [], page: 1, size: 25, total: 0 },
        });
      }),
    );

    renderPage();
    expect(await screen.findByRole("link", { name: "Crocin" })).toBeTruthy();
    fireEvent.change(screen.getByLabelText("Text"), { target: { value: "cr" } });
    fireEvent.change(screen.getByLabelText("Text"), { target: { value: "crocin" } });
    await waitFor(() => {
      expect(urls.map(queryValue).filter((value) => value != null)).toEqual(["crocin"]);
    });
  });
});

function queryValue(url: string) {
  return new URL(url, "http://localhost").searchParams.get("q");
}
