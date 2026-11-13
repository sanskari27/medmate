import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { Provider } from "react-redux";
import { MemoryRouter } from "react-router-dom";
import { afterEach, describe, expect, it, vi } from "vitest";
import { createAppStore } from "@/app/store";
import { writeSession } from "@/services/storage";
import type { Session } from "@/types";
import type { ExpenseList } from "../../model";
import { ExpensesPage } from "./ExpensesPage";

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
    permissions: ["expenses:read"],
    pinSetupRequired: false,
  },
};

const empty = {
  expenses: [],
  summary: { count: 0, total: "0.00", gst: "0.00" },
  categories: ["Rent Expense"],
  page: 1,
  size: 25,
  total: 0,
} satisfies ExpenseList;

const listed = {
  expenses: [
    {
      number: "EXP-1001",
      spentOn: "2026-01-15",
      party: "Landlord",
      category: "Rent Expense",
      paymentMode: "cash" as const,
      amount: "118.00",
      gst: 18,
      note: null,
    },
  ],
  summary: { count: 1, total: "118.00", gst: "18.00" },
  categories: ["Rent Expense"],
  page: 1,
  size: 25,
  total: 1,
} satisfies ExpenseList;

function renderPage(permissions: string[], body: ExpenseList = empty) {
  writeSession({ ...session, account: { ...session.account, permissions } });
  const requested: string[] = [];
  vi.stubGlobal(
    "fetch",
    vi.fn(async (input: RequestInfo | URL, init?: RequestInit) => {
      const request = input instanceof Request ? input : new Request(input, init);
      requested.push(`${request.method} ${request.url}`);
      if (request.method === "POST") {
        return new Response(JSON.stringify({ expense: listed.expenses[0] }), {
          status: 201,
          headers: { "content-type": "application/json" },
        });
      }
      return new Response(
        JSON.stringify(request.url.includes("/export") ? { expenses: listed.expenses } : body),
        {
          status: 200,
          headers: { "content-type": "application/json" },
        },
      );
    }),
  );
  vi.spyOn(URL, "createObjectURL").mockReturnValue("blob:expenses");
  vi.spyOn(URL, "revokeObjectURL").mockImplementation(() => undefined);
  vi.spyOn(HTMLAnchorElement.prototype, "click").mockImplementation(() => undefined);
  render(
    <Provider store={createAppStore()}>
      <MemoryRouter>
        <ExpensesPage />
      </MemoryRouter>
    </Provider>,
  );
  return requested;
}

afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
  sessionStorage.clear();
});

describe("ExpensesPage", () => {
  it("shows the summary cards and the empty filter", async () => {
    const requested = renderPage(["expenses:read"]);
    expect(await screen.findByText("No expenses match the current filter.")).toBeTruthy();
    expect(screen.getByText("Expenses")).toBeTruthy();
    expect(screen.getByText("Total spend")).toBeTruthy();
    expect(screen.getByText("GST (ITC eligible)")).toBeTruthy();
    expect(screen.getAllByText("Last 365 Days")).toHaveLength(2);
    expect(screen.queryByRole("button", { name: "Create Expense" })).toBeNull();
    await waitFor(() => expect(requested.some((url) => url.includes("size=25"))).toBe(true));
  });

  it("downloads the filtered register without a page", async () => {
    const requested = renderPage(["expenses:read", "expenses:create"], listed);
    expect(await screen.findByText("EXP-1001")).toBeTruthy();
    expect(screen.getAllByText("₹118.00").length).toBeGreaterThan(0);
    expect(screen.getByText("Total · 1 expenses")).toBeTruthy();
    fireEvent.click(screen.getByRole("button", { name: "Excel" }));
    await waitFor(() =>
      expect(
        requested.some(
          (url) => url.includes("/pharmacy/expenses/export") && !url.includes("page="),
        ),
      ).toBe(true),
    );
  });

  it("closes the dialog after an expense is saved", async () => {
    renderPage(["expenses:create", "expenses:read"], listed);
    fireEvent.click(await screen.findByRole("button", { name: "Create Expense" }));
    fireEvent.change(screen.getByLabelText("Paid to (party)"), { target: { value: "Landlord" } });
    fireEvent.change(screen.getByLabelText("Amount ₹ (incl. GST)"), { target: { value: "118" } });
    fireEvent.click(screen.getByRole("button", { name: "Save expense" }));
    await waitFor(() =>
      expect(screen.queryByRole("dialog", { name: "Create Expense" })).toBeNull(),
    );
  });
});
