import { cleanup, fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import { Provider } from "react-redux";
import { afterEach, describe, expect, it, vi } from "vitest";
import { createAppStore } from "@/app/store";
import { writeSession } from "@/services/storage";
import type { Session } from "@/types";
import type { StaffMember } from "../../catalog";
import { UsersPage } from "./UsersPage";

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

const member: StaffMember = {
  id: "staff-1",
  phone: "+919811111108",
  displayName: "Counter",
  permissions: ["users:read"],
  disabled: false,
  pinSet: true,
};

function asRequest(input: RequestInfo | URL, init?: RequestInit) {
  return input instanceof Request ? input : new Request(input, init);
}

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "content-type": "application/json" },
  });
}

function renderPage(onCall?: (request: Request) => Promise<Response> | Response) {
  writeSession(session);
  let rows = [member];
  vi.stubGlobal(
    "fetch",
    vi.fn(async (input: RequestInfo | URL, init?: RequestInit) => {
      const request = asRequest(input, init);
      if (onCall && request.url.includes("/pharmacy/staff")) return onCall(request);
      if (request.method === "GET" && request.url.includes("/pharmacy/staff")) return json(rows);
      if (request.method === "PATCH" && request.url.includes("/pharmacy/staff")) {
        const body = (await request.json()) as Partial<StaffMember>;
        rows = rows.map((row) => ({ ...row, ...body }));
        return json(rows[0]);
      }
      return json({ detail: "Not found" }, 404);
    }),
  );
  return render(
    <Provider store={createAppStore()}>
      <UsersPage />
    </Provider>,
  );
}

afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
  sessionStorage.clear();
});

describe("UsersPage", () => {
  it("lists staff without a role field and shows the management permissions", async () => {
    renderPage();
    expect(await screen.findByText("Counter")).toBeTruthy();
    expect(screen.getByText("1 / 37")).toBeTruthy();
    expect(screen.queryByRole("combobox")).toBeNull();
    expect(screen.queryByText("Reset to Cashier defaults")).toBeNull();
    fireEvent.click(screen.getByRole("button", { name: "Add user" }));
    expect(screen.getByRole("dialog", { name: "Add team member" })).toBeTruthy();
    const dialog = screen.getByRole("dialog", { name: "Add team member" });
    expect(within(dialog).getByText("Counter")).toBeTruthy();
    expect(screen.getByRole("checkbox", { name: "Billing Read" })).toBeTruthy();
    expect(screen.getByRole("checkbox", { name: "Billing Charge" })).toBeTruthy();
    expect(screen.getByRole("checkbox", { name: "Sales Read" })).toBeTruthy();
    expect(screen.getByRole("checkbox", { name: "Sales Return" })).toBeTruthy();
    expect(screen.getByRole("checkbox", { name: "CRM · Patients Read" })).toBeTruthy();
    expect(screen.getByRole("checkbox", { name: "CRM · Patients Update" })).toBeTruthy();
    expect(screen.getByText("Management")).toBeTruthy();
    expect(screen.getByText("Manage users")).toBeTruthy();
    expect(screen.getByText("Help & Support")).toBeTruthy();
    expect(screen.getByRole("checkbox", { name: "Manage users Read" })).toBeTruthy();
    expect(screen.getByRole("checkbox", { name: "Manage users Delete" })).toBeTruthy();
    expect(screen.getByRole("checkbox", { name: "Help & Support Write" })).toBeTruthy();
    expect(screen.getByRole("checkbox", { name: "Invoice Settings Read" })).toBeTruthy();
    expect(screen.getByRole("checkbox", { name: "Invoice Settings Update" })).toBeTruthy();
    expect(screen.getByText("Catalogue")).toBeTruthy();
    expect(screen.getByRole("checkbox", { name: "Distributors Pay" })).toBeTruthy();
    expect(screen.getByRole("checkbox", { name: "Purchases Return" })).toBeTruthy();
    expect(screen.getByRole("checkbox", { name: "Inventory Export" })).toBeTruthy();
    expect(screen.getByRole("checkbox", { name: "Rack & Locations Read" })).toBeTruthy();
    expect(screen.getByRole("checkbox", { name: "Rack & Locations Create" })).toBeTruthy();
    expect(screen.getByRole("checkbox", { name: "Rack & Locations Update" })).toBeTruthy();
    expect(screen.getByRole("checkbox", { name: "Rack & Locations Export" })).toBeTruthy();
    expect(screen.getByRole("checkbox", { name: "Offers Read" })).toBeTruthy();
    expect(screen.getByRole("checkbox", { name: "Offers Create" })).toBeTruthy();
    expect(screen.getByRole("checkbox", { name: "Offers Update" })).toBeTruthy();
    expect(screen.getByRole("checkbox", { name: "Offers Delete" })).toBeTruthy();
    expect(screen.queryByLabelText(/role/i)).toBeNull();
  });

  it("shows the typed PIN once after create", async () => {
    const calls: { method: string; body: unknown }[] = [];
    renderPage(async (request) => {
      if (request.method === "GET") return json([]);
      const body = await request.json();
      calls.push({ method: request.method, body });
      return json(
        {
          id: "staff-2",
          phone: "+919876543210",
          displayName: "Priya Sharma",
          permissions: ["users:read"],
          disabled: false,
          pinSet: true,
        },
        201,
      );
    });
    fireEvent.click(await screen.findByRole("button", { name: "Add user" }));
    fireEvent.change(screen.getByLabelText("Full name"), { target: { value: "Priya Sharma" } });
    fireEvent.change(screen.getByLabelText("Mobile number"), { target: { value: "9876543210" } });
    fireEvent.change(screen.getByLabelText("4-digit PIN"), { target: { value: "1357" } });
    fireEvent.click(screen.getByRole("checkbox", { name: "Manage users Read" }));
    fireEvent.click(screen.getByRole("button", { name: "Create user" }));
    expect(await screen.findByText("1357")).toBeTruthy();
    expect(screen.getByRole("button", { name: "Copy PIN" })).toBeTruthy();
    expect(calls[0]?.body).toMatchObject({
      displayName: "Priya Sharma",
      phone: "9876543210",
      pin: "1357",
      permissions: ["users:read"],
    });
  });

  it("disables a staff row and leaves it in the table", async () => {
    const patches: unknown[] = [];
    renderPage(async (request) => {
      if (request.method === "GET") return json([member]);
      const body = await request.json();
      patches.push(body);
      return json({ ...member, disabled: true });
    });
    expect(await screen.findByText("Counter")).toBeTruthy();
    fireEvent.click(screen.getByRole("button", { name: "Disable Counter" }));
    await waitFor(() => expect(patches).toEqual([{ disabled: true }]));
    expect(screen.getByText("Counter")).toBeTruthy();
  });
});
