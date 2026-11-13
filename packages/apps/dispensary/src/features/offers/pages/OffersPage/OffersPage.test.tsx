import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { Provider } from "react-redux";
import { afterEach, describe, expect, it, vi } from "vitest";
import { createAppStore } from "@/app/store";
import { writeSession } from "@/services/storage";
import type { Session } from "@/types";
import { OffersPage } from "./OffersPage";

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
    permissions: ["offers:read"],
    pinSetupRequired: false,
  },
};

const offers = {
  offers: [
    {
      id: "OFR-001",
      title: "Monsoon Health Sale",
      code: "NAMMA25",
      type: "pct",
      value: 10,
      scope: "all",
      target: null,
      active: true,
      itemCount: 2,
    },
    {
      id: "OFR-002",
      title: "Crocin offer",
      code: "CROCIN5",
      type: "flat",
      value: 5,
      scope: "product",
      target: "med-a",
      active: true,
      itemCount: 1,
    },
  ],
  products: [{ productId: "med-a", name: "Crocin Advance" }],
};

function json(body: unknown) {
  return new Response(JSON.stringify(body), {
    status: 200,
    headers: { "content-type": "application/json" },
  });
}

function renderPage(body: unknown, permissions: string[]) {
  writeSession({ ...session, account: { ...session.account, permissions } });
  vi.stubGlobal(
    "fetch",
    vi.fn(async () => json(body)),
  );
  return render(
    <Provider store={createAppStore()}>
      <OffersPage />
    </Provider>,
  );
}

afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
  sessionStorage.clear();
});

describe("OffersPage", () => {
  it("shows an empty list", async () => {
    renderPage({ offers: [], products: [] }, ["offers:read", "offers:create"]);
    expect(await screen.findByText("No offers yet")).toBeTruthy();
    expect(screen.getByText("Create a discount to attract online customers.")).toBeTruthy();
  });

  it("shows a percent offer and a single-medicine offer", async () => {
    renderPage(offers, ["offers:read", "offers:create", "offers:update", "offers:delete"]);
    expect(await screen.findByText("NAMMA25")).toBeTruthy();
    expect(screen.getByText("10% OFF")).toBeTruthy();
    expect(screen.getByText("all products")).toBeTruthy();
    expect(screen.getByText("1 product")).toBeTruthy();
  });

  it("searches inventory when the offer targets one product", async () => {
    const urls: string[] = [];
    writeSession({
      ...session,
      account: { ...session.account, permissions: ["offers:read", "offers:create"] },
    });
    vi.stubGlobal(
      "fetch",
      vi.fn(async (input: RequestInfo | URL) => {
        urls.push(String(input instanceof Request ? input.url : input));
        return json({ offers: [], products: [] });
      }),
    );
    render(
      <Provider store={createAppStore()}>
        <OffersPage />
      </Provider>,
    );
    fireEvent.click(await screen.findByRole("button", { name: "Create offer" }));
    fireEvent.change(screen.getByLabelText("Applies to"), { target: { value: "product" } });
    fireEvent.change(screen.getByLabelText("Search product"), { target: { value: "crocin" } });
    await waitFor(() => {
      expect(
        urls.some(
          (url) =>
            url.includes("/pharmacy/inventory") &&
            url.includes("size=25") &&
            url.includes("q=crocin"),
        ),
      ).toBe(true);
    });
  });

  it("hides create, pause, edit, and delete without those keys", async () => {
    renderPage(offers, ["offers:read"]);
    expect(await screen.findByText("NAMMA25")).toBeTruthy();
    expect(screen.queryByRole("button", { name: "Create offer" })).toBeNull();
    expect(screen.queryByRole("button", { name: "Toggle offer" })).toBeNull();
    expect(screen.queryByRole("button", { name: "Edit" })).toBeNull();
    expect(screen.queryByRole("button", { name: "Delete" })).toBeNull();
  });
});
