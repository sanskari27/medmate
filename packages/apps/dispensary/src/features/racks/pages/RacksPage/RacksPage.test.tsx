import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { Provider } from "react-redux";
import { MemoryRouter } from "react-router-dom";
import { afterEach, describe, expect, it, vi } from "vitest";
import { createAppStore } from "@/app/store";
import { writeSession } from "@/services/storage";
import type { Session } from "@/types";
import { RacksPage } from "./RacksPage";

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
    permissions: ["racks:read"],
    pinSetupRequired: false,
  },
};

const racks = {
  racks: ["A1", "B2"],
  products: [
    {
      productId: "DR100",
      name: "Crocin Advance",
      marketer: "GSK",
      composition: "Paracetamol",
      form: "Tablet",
      pack: "Strip",
      type: "Tablet",
      reorderLevel: 20,
      rack: "A1",
      rackAlt: null,
      batches: [{ batchNo: "B1", expiry: "2027-03", qty: 5, rate: "10.00", mrp: "18.00" }],
    },
    {
      productId: "DR80",
      name: "Bulk Drops",
      marketer: "Cipla",
      composition: "Sodium chloride",
      form: "Drops",
      pack: "Bottle",
      type: "Drops",
      reorderLevel: 10,
      rack: null,
      rackAlt: null,
      batches: [{ batchNo: "B2", expiry: "2027-06", qty: 2, rate: "10.00", mrp: "15.00" }],
    },
  ],
};

function renderPage(permissions: string[] = ["racks:read"]) {
  writeSession({ ...session, account: { ...session.account, permissions } });
  vi.stubGlobal(
    "fetch",
    vi.fn(
      async () =>
        new Response(JSON.stringify(racks), {
          status: 200,
          headers: { "content-type": "application/json" },
        }),
    ),
  );
  return render(
    <Provider store={createAppStore()}>
      <MemoryRouter>
        <RacksPage />
      </MemoryRouter>
    </Provider>,
  );
}

describe("RacksPage", () => {
  afterEach(() => {
    cleanup();
    sessionStorage.clear();
    vi.unstubAllGlobals();
  });

  it("shows the map, the empty rack, and hides create and export without those keys", async () => {
    renderPage();
    expect(await screen.findByText("Racks created")).toBeTruthy();
    expect(screen.getByText("Racks / zones")).toBeTruthy();
    expect(screen.getByText("Medicines mapped")).toBeTruthy();
    expect(screen.getByText("No location yet")).toBeTruthy();
    expect(screen.getByRole("button", { name: /Rack map/ })).toBeTruthy();
    expect(screen.getByRole("button", { name: /Assign locations/ })).toBeTruthy();
    expect(screen.getByText("B2")).toBeTruthy();
    expect(screen.queryByRole("button", { name: /Add rack/ })).toBeNull();
    expect(screen.queryByRole("button", { name: /Audit Excel/ })).toBeNull();
    expect(screen.getByRole("button", { name: /Print rack labels/ })).toBeTruthy();
    fireEvent.click(screen.getByRole("button", { name: /Crocin Advance/ }));
    expect(screen.getByRole("dialog", { name: "Crocin Advance" })).toBeTruthy();
  });

  it("opens assign locations for medicines with no rack", async () => {
    renderPage(["racks:read", "racks:update"]);
    fireEvent.click(await screen.findByRole("button", { name: /Assign locations/ }));
    expect(screen.getByLabelText("Rack")).toBeTruthy();
    expect(screen.queryByRole("button", { name: /Bulk Drops/ })).toBeNull();
    expect(screen.getByText("Bulk Drops")).toBeTruthy();
    expect(screen.queryByText("Crocin Advance")).toBeNull();
  });
});
