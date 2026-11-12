import { cleanup, fireEvent, render, screen, within } from "@testing-library/react";
import { Provider } from "react-redux";
import { afterEach, describe, expect, it, vi } from "vitest";
import { createAppStore } from "@/app/store";
import { writeSession } from "@/services/storage";
import type { Session } from "@/types";
import { DistributorsPage } from "./DistributorsPage";

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
    pharmacyRole: "owner",
    verificationStatus: "approved",
    rejection: null,
    subtypes: [],
    permissions: [],
    pinSetupRequired: false,
  },
};

const list = {
  distributors: [
    {
      id: "DST-001",
      name: "Bengaluru Pharma Distributors",
      contactPerson: "Ramesh Gupta",
      phone: "+91 80 4123 7788",
      email: "order@bpharma.in",
      gstin: "29ABCDE1234F1Z5",
      drugLicenceNumber: "KA-W-2291",
      address: "12 Industrial Layout",
      city: "Bengaluru",
      state: "Karnataka",
      paymentTerms: "30 days credit",
      openingBalance: 18400,
      outstanding: 18400,
      active: true,
      showInPurchases: true,
      transactions: [],
    },
    {
      id: "DST-002",
      name: "Apollo Wholesale",
      contactPerson: "Vinod Kumar",
      phone: "+91 80 6677 1234",
      email: "wholesale@apollo.in",
      gstin: "29LMNOP9812K3Z9",
      drugLicenceNumber: "KA-W-3329",
      address: "8 Market Road",
      city: "Bengaluru",
      state: "Karnataka",
      paymentTerms: "Advance",
      openingBalance: 10000,
      outstanding: 12500,
      active: true,
      showInPurchases: true,
      transactions: [
        {
          id: "TXN-001",
          type: "purchase",
          amount: 5000,
          reference: "BILL-1",
          note: "Opening stock",
          mode: null,
          recordedAt: "2026-11-01T09:00:00Z",
        },
        {
          id: "TXN-002",
          type: "payment",
          amount: 2000,
          reference: null,
          note: "Part payment",
          mode: "upi",
          recordedAt: "2026-11-02T09:00:00Z",
        },
        {
          id: "TXN-003",
          type: "return",
          amount: 500,
          reference: "RET-1",
          note: null,
          mode: null,
          recordedAt: "2026-11-03T09:00:00Z",
        },
      ],
    },
  ],
};

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "content-type": "application/json" },
  });
}

function renderPage(
  role: Session["account"]["pharmacyRole"] = "owner",
  permissions: string[] = [],
) {
  writeSession({
    ...session,
    account: { ...session.account, pharmacyRole: role, permissions },
  });
  vi.stubGlobal(
    "fetch",
    vi.fn(async () => json(list)),
  );
  return render(
    <Provider store={createAppStore()}>
      <DistributorsPage />
    </Provider>,
  );
}

afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
  sessionStorage.clear();
});

describe("DistributorsPage", () => {
  it("opens Add distributor with the form sections and a disabled save", async () => {
    renderPage();
    expect(await screen.findByText("Bengaluru Pharma Distributors")).toBeTruthy();
    expect(screen.queryByRole("columnheader", { name: "Products" })).toBeNull();
    expect(screen.queryByText("Supply list")).toBeNull();
    expect(screen.queryByText("Price compare")).toBeNull();
    expect(screen.queryByText("Products sourced")).toBeNull();
    fireEvent.click(screen.getByRole("button", { name: "Add distributor" }));
    const dialog = screen.getByRole("dialog", { name: "Add distributor" });
    const headings = [...dialog.querySelectorAll("h4")].map((heading) => heading.textContent);
    expect(headings).toEqual([
      "Basic information",
      "Legal & registration",
      "Address",
      "Financial information",
      "Status & availability",
    ]);
    expect(within(dialog).getByRole("button", { name: "Add distributor" })).toHaveProperty(
      "disabled",
      true,
    );
  });

  it("hides Add distributor when staff can only read", async () => {
    renderPage("staff", ["distributors:read"]);
    expect(await screen.findByText("Bengaluru Pharma Distributors")).toBeTruthy();
    expect(screen.queryByRole("button", { name: "Add distributor" })).toBeNull();
  });

  it("disables Inactive when staff can update but not delete", async () => {
    renderPage("staff", ["distributors:read", "distributors:update"]);
    fireEvent.click(
      await screen.findByRole("button", { name: "Edit Bengaluru Pharma Distributors" }),
    );
    const status = within(screen.getByRole("dialog")).getByLabelText(
      "Active status",
    ) as HTMLSelectElement;
    const inactive = [...status.options].find((option) => option.value === "inactive");
    expect(inactive?.disabled).toBe(true);
  });

  it("locks the opening balance once a ledger line exists and lists the statement", async () => {
    renderPage();
    expect(await screen.findByText("Apollo Wholesale")).toBeTruthy();
    fireEvent.click(screen.getByRole("button", { name: "Edit Bengaluru Pharma Distributors" }));
    expect(screen.getByLabelText("Outstanding payable")).toHaveProperty("disabled", false);
    fireEvent.click(screen.getByRole("button", { name: "Close" }));
    fireEvent.click(screen.getByRole("button", { name: "Edit Apollo Wholesale" }));
    expect(screen.getByLabelText("Outstanding payable")).toHaveProperty("disabled", true);
    fireEvent.click(screen.getByRole("button", { name: "Close" }));
    fireEvent.click(screen.getByRole("button", { name: "Transactions Apollo Wholesale" }));
    const dialog = screen.getByRole("dialog", { name: "Apollo Wholesale transactions" });
    expect(dialog.className).toContain("max-w-[960px]");
    expect(within(dialog).getByText("Purchase bill")).toBeTruthy();
    expect(within(dialog).getByText("Payment")).toBeTruthy();
    expect(within(dialog).getByText("Return")).toBeTruthy();
    expect(within(dialog).getByRole("button", { name: "Record payment" })).toBeTruthy();
  });

  it("hides the record form when staff cannot pay", async () => {
    renderPage("staff", ["distributors:read"]);
    fireEvent.click(await screen.findByRole("button", { name: "Transactions Apollo Wholesale" }));
    const dialog = screen.getByRole("dialog", { name: "Apollo Wholesale transactions" });
    expect(within(dialog).getByText("Purchase bill")).toBeTruthy();
    expect(within(dialog).queryByRole("button", { name: "Record payment" })).toBeNull();
  });
});
