import { cleanup, fireEvent, render, screen, within } from "@testing-library/react";
import { Provider } from "react-redux";
import { MemoryRouter } from "react-router-dom";
import { afterEach, describe, expect, it, vi } from "vitest";
import { createAppStore } from "@/app/store";
import { writeSession } from "@/services/storage";
import type { Session } from "@/types";
import { AppRouter } from "./AppRouter";

const session: Session = {
  accessToken: "access",
  refreshToken: "refresh",
  expiresIn: 900,
  account: {
    id: "account-id",
    accountType: "pharmacy",
    phone: "+919876543210",
    displayName: "Ada",
    pharmacyId: null,
    pharmacyRole: "owner",
    verificationStatus: "approved",
    rejection: null,
    subtypes: [],
    permissions: [],
    pinSetupRequired: false,
  },
};

function renderAt(path: string) {
  return render(
    <Provider store={createAppStore()}>
      <MemoryRouter initialEntries={[path]}>
        <AppRouter />
      </MemoryRouter>
    </Provider>,
  );
}

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

afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
  sessionStorage.clear();
});

describe("AppRouter", () => {
  it("sends a login code and shows the latest mock OTP", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async (input: RequestInfo) => {
        const url = requestUrl(input);
        if (url.includes("/auth/otp/send")) return json({ mode: "otp" });
        if (url.includes("/sms-mock/messages")) {
          return json([
            { phone: "+919876543210", code: "111111" },
            { phone: "+919876543210", code: "654321" },
          ]);
        }
        return json({ detail: "Not found" }, 404);
      }),
    );

    renderAt("/");
    fireEvent.click(screen.getByRole("button", { name: "I already have an account · Log in" }));
    fireEvent.change(screen.getByPlaceholderText("98860 12345"), {
      target: { value: "9876543210" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Continue" }));

    expect(await screen.findByText("654321")).toBeTruthy();
    expect(screen.getByRole("button", { name: "Auto-fill" })).toBeTruthy();
    expect(screen.queryByPlaceholderText("Sri Sai Medicals")).toBeNull();
  });

  it("stays on the OTP step when the code is rejected", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async (input: RequestInfo) => {
        const url = requestUrl(input);
        if (url.includes("/auth/otp/send")) return json({ mode: "otp" });
        if (url.includes("/sms-mock/messages")) return json([]);
        if (url.includes("/auth/otp/verify")) {
          const body = typeof input === "string" ? "" : await input.text();
          expect(body).toContain("000000");
          return json({ title: "Unauthorized", detail: "Code was not accepted" }, 401);
        }
        return json({ detail: "Not found" }, 404);
      }),
    );

    renderAt("/");
    fireEvent.click(screen.getByRole("button", { name: "I already have an account · Log in" }));
    fireEvent.change(screen.getByPlaceholderText("98860 12345"), {
      target: { value: "9876543210" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Continue" }));
    expect(await screen.findByRole("button", { name: "Verify & log in" })).toBeTruthy();
    fireEvent.change(screen.getByPlaceholderText("••••••"), { target: { value: "000000" } });
    fireEvent.click(screen.getByRole("button", { name: "Verify & log in" }));
    expect(await screen.findByText("Code was not accepted")).toBeTruthy();
  });

  it("shows the PIN step when the API asks for a PIN", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async (input: RequestInfo) => {
        const url = requestUrl(input);
        if (url.includes("/auth/otp/send")) return json({ mode: "pin" });
        return json({ detail: "Not found" }, 404);
      }),
    );

    renderAt("/");
    fireEvent.click(screen.getByRole("button", { name: "I already have an account · Log in" }));
    fireEvent.change(screen.getByPlaceholderText("98860 12345"), {
      target: { value: "9876543210" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Continue" }));
    expect(await screen.findByText("4-digit PIN")).toBeTruthy();
  });

  it("opens the PIN step on the Staff tab when login uses a PIN", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async (input: RequestInfo) => {
        const url = requestUrl(input);
        if (url.includes("/auth/otp/send")) return json({ mode: "pin" });
        return json({ detail: "Not found" }, 404);
      }),
    );

    renderAt("/");
    fireEvent.click(screen.getByRole("button", { name: "I already have an account · Log in" }));
    fireEvent.click(screen.getByRole("radio", { name: "Staff" }));
    fireEvent.change(screen.getByPlaceholderText("98860 12345"), {
      target: { value: "9876543210" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Continue" }));
    expect(await screen.findByText("4-digit PIN")).toBeTruthy();
    expect(screen.queryByText("6-digit OTP")).toBeNull();
    expect(
      screen.queryByText("This number is a pharmacy owner. Choose Pharmacy owner to sign in."),
    ).toBeNull();
  });

  it("redirects a signed-out visit to the login screen", () => {
    renderAt("/dashboard");
    expect(screen.getByRole("button", { name: "Get started" })).toBeTruthy();
  });

  it("opens an empty page after a verified login", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async (input: RequestInfo) => {
        const url = requestUrl(input);
        if (url.includes("/auth/otp/send")) return json({ mode: "otp" });
        if (url.includes("/sms-mock/messages"))
          return json([{ phone: "+919876543210", code: "654321" }]);
        if (url.includes("/auth/otp/verify")) return json(session);
        if (url.includes("/auth/sign-out")) return new Response(null, { status: 204 });
        return json({ detail: "Not found" }, 404);
      }),
    );

    renderAt("/");
    fireEvent.click(screen.getByRole("button", { name: "I already have an account · Log in" }));
    fireEvent.change(screen.getByPlaceholderText("98860 12345"), {
      target: { value: "9876543210" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Continue" }));
    fireEvent.click(await screen.findByRole("button", { name: "Auto-fill" }));
    fireEvent.click(screen.getByRole("button", { name: "Verify & log in" }));
    expect(await screen.findByText("Loading dashboard")).toBeTruthy();
    expect(screen.getByText("Pharmacy owner")).toBeTruthy();
    fireEvent.click(screen.getByRole("button", { name: "Manage Users" }));
    expect(screen.getByText("Staff & access control")).toBeTruthy();
    fireEvent.click(screen.getByRole("button", { name: "Log out" }));
    expect(await screen.findByRole("button", { name: "Get started" })).toBeTruthy();
  });

  it("does not keep a session when the account role does not match", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async (input: RequestInfo) => {
        const url = requestUrl(input);
        if (url.includes("/auth/otp/send")) return json({ mode: "otp" });
        if (url.includes("/sms-mock/messages"))
          return json([{ phone: "+919876543210", code: "654321" }]);
        if (url.includes("/auth/otp/verify")) {
          return json({
            ...session,
            account: { ...session.account, pharmacyRole: "staff" },
          });
        }
        if (url.includes("/auth/sign-out")) return new Response(null, { status: 204 });
        return json({ detail: "Not found" }, 404);
      }),
    );

    renderAt("/");
    fireEvent.click(screen.getByRole("button", { name: "I already have an account · Log in" }));
    fireEvent.change(screen.getByPlaceholderText("98860 12345"), {
      target: { value: "9876543210" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Continue" }));
    fireEvent.click(await screen.findByRole("button", { name: "Auto-fill" }));
    fireEvent.click(screen.getByRole("button", { name: "Verify & log in" }));
    expect(
      await screen.findByText("This number is a staff account. Choose Staff to sign in."),
    ).toBeTruthy();
    expect(screen.queryByText("Loading dashboard")).toBeNull();
  });

  it("signs up with a mobile number and no role selector", () => {
    renderAt("/");
    fireEvent.click(screen.getByRole("button", { name: "Get started" }));
    expect(screen.getByRole("heading", { name: "Create your pharmacy" })).toBeTruthy();
    expect(screen.queryByRole("radio", { name: "Staff" })).toBeNull();
    expect(screen.getByPlaceholderText("98860 12345")).toBeTruthy();
    expect(screen.queryByPlaceholderText("Sri Sai Medicals")).toBeNull();
  });

  it("opens setup for an incomplete or rejected owner and keeps them out of the dashboard", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () =>
        json({
          pharmacyId: "pharmacy-id",
          status: "incomplete",
          rejection: null,
          phone: "+919876543210",
          name: null,
          tagline: null,
          email: null,
          address: null,
          city: null,
          state: null,
          pincode: null,
          businessTypes: [],
          industry: null,
          registrationType: null,
          pharmacyType: null,
          gstin: null,
          pan: null,
          drugLicenceNo: null,
          fssaiNo: null,
          tradeLicenceNo: null,
          enableTds: false,
          enableTcs: false,
          pharmacistName: null,
          invoicePrefix: null,
          terms: null,
          acceptOnlineOrders: false,
          selfOrderKiosk: false,
          eInvoicing: false,
          looseSelling: false,
          lowStockAlerts: true,
          submittedAt: null,
          documents: [],
        }),
      ),
    );

    writeSession({ ...session, account: { ...session.account, verificationStatus: "incomplete" } });
    renderAt("/dashboard");
    expect(await screen.findByText("Let's set up your pharmacy")).toBeTruthy();
    expect(screen.queryByText("Loading dashboard")).toBeNull();
  });

  it("opens setup when the application was rejected", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () =>
        json({
          pharmacyId: "pharmacy-id",
          status: "rejected",
          rejection: { stage: "admin", comment: "Need a clearer seal" },
          phone: "+919876543210",
          name: "Care Pharmacy",
          tagline: null,
          email: "owner@example.com",
          address: "12 Market Road",
          city: "Bengaluru",
          state: "Karnataka",
          pincode: "560001",
          businessTypes: [],
          industry: "Pharmacy & Healthcare",
          registrationType: "Proprietorship",
          pharmacyType: "hospital",
          gstin: "29ABCDE1234F1Z5",
          pan: "ABCDE1234F",
          drugLicenceNo: "DL-1",
          fssaiNo: "FSSAI-1",
          tradeLicenceNo: "TL-1",
          enableTds: false,
          enableTcs: false,
          pharmacistName: "Asha Rao",
          invoicePrefix: "CARE",
          terms: null,
          acceptOnlineOrders: false,
          selfOrderKiosk: false,
          eInvoicing: false,
          looseSelling: false,
          lowStockAlerts: true,
          submittedAt: "2026-11-11T10:00:00Z",
          documents: [],
        }),
      ),
    );

    writeSession({ ...session, account: { ...session.account, verificationStatus: "rejected" } });
    renderAt("/dashboard");
    expect(await screen.findByText("Need a clearer seal")).toBeTruthy();
    expect(screen.getByText("Admin rejected this application")).toBeTruthy();
  });

  it("opens the waiting screen while compliance is reviewing", () => {
    writeSession({
      ...session,
      account: { ...session.account, verificationStatus: "pending_compliance" },
    });
    renderAt("/dashboard");
    expect(screen.getByRole("heading", { name: "Your application is under review" })).toBeTruthy();
    expect(screen.getAllByText("Compliance is reviewing this application.").length).toBeGreaterThan(
      0,
    );
    expect(screen.queryByText("Loading dashboard")).toBeNull();
  });

  it("sends a disabled owner to the restricted screen", () => {
    writeSession({
      ...session,
      account: {
        ...session.account,
        disabled: true,
        pinSetupRequired: true,
        verificationStatus: "approved",
      },
    });
    renderAt("/dashboard");
    expect(screen.getByRole("heading", { name: "Your account is restricted." })).toBeTruthy();
    expect(screen.getByText("Contact us to get it unblocked.")).toBeTruthy();
    expect(screen.queryByText("Loading dashboard")).toBeNull();
    expect(screen.queryByRole("heading", { name: "Set a PIN" })).toBeNull();
  });

  it("keeps staff on login when the pharmacy is restricted", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async (input: RequestInfo) => {
        const url = requestUrl(input);
        if (url.includes("/auth/otp/send")) return json({ mode: "otp" });
        if (url.includes("/sms-mock/messages"))
          return json([{ phone: "+919876543210", code: "654321" }]);
        if (url.includes("/auth/otp/verify"))
          return json({ detail: "This pharmacy is restricted." }, 401);
        return json({ detail: "Not found" }, 404);
      }),
    );

    renderAt("/");
    fireEvent.click(screen.getByRole("button", { name: "I already have an account · Log in" }));
    fireEvent.click(screen.getByRole("radio", { name: "Staff" }));
    fireEvent.change(screen.getByPlaceholderText("98860 12345"), {
      target: { value: "9876543210" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Continue" }));
    fireEvent.click(await screen.findByRole("button", { name: "Auto-fill" }));
    fireEvent.click(screen.getByRole("button", { name: "Verify & log in" }));
    expect(await screen.findByText("This pharmacy is restricted.")).toBeTruthy();
    expect(screen.queryByText("Loading dashboard")).toBeNull();
    expect(sessionStorage.length).toBe(0);
  });

  it("shows Manage Users, Help & Support, and Profile under Management", () => {
    writeSession(session);
    renderAt("/dashboard");
    const nav = document.querySelector("[data-slot=nav]");
    expect(nav).toBeTruthy();
    const names = within(nav as HTMLElement)
      .getAllByRole("button")
      .map((button) => button.textContent?.trim());
    expect(names).toEqual([
      "Dashboard",
      "Billing",
      "Sales",
      "CRM - Patients",
      "Distributors",
      "Purchases",
      "Inventory",
      "Rack & Locations",
      "Offers",
      "Expenses",
      "Reports",
      "Employees",
      "Invoice Settings",
      "Manage Users",
      "Profile",
      "Help & Support",
    ]);
    expect(screen.getByText("Management")).toBeTruthy();
    expect(screen.getByText("Catalogue")).toBeTruthy();
    expect(screen.getByText("Business")).toBeTruthy();
    expect(screen.getByText("Counter")).toBeTruthy();
  });

  it("sends pharmacy staff away from Help & Support", () => {
    writeSession({
      ...session,
      account: { ...session.account, pharmacyRole: "staff" },
    });
    renderAt("/support");
    expect(screen.getByText("Loading dashboard")).toBeTruthy();
    expect(screen.queryByRole("button", { name: "Help & Support" })).toBeNull();
    expect(screen.queryByRole("button", { name: "Profile" })).toBeNull();
    expect(screen.queryByRole("button", { name: "Manage Users" })).toBeNull();
    expect(screen.queryByText("Management")).toBeNull();
  });

  it("sends pharmacy staff away from Manage Users", () => {
    writeSession({
      ...session,
      account: { ...session.account, pharmacyRole: "staff" },
    });
    renderAt("/users");
    expect(screen.getByText("Loading dashboard")).toBeTruthy();
    expect(screen.queryByRole("button", { name: "Manage Users" })).toBeNull();
  });

  it("shows Employees to staff who can read them", () => {
    writeSession({
      ...session,
      account: { ...session.account, pharmacyRole: "staff", permissions: ["employees:read"] },
    });
    renderAt("/dashboard");
    expect(screen.getByRole("button", { name: "Employees" })).toBeTruthy();
    expect(screen.getByText("Management")).toBeTruthy();
    expect(screen.queryByRole("button", { name: "Invoice Settings" })).toBeNull();
    expect(screen.queryByRole("button", { name: "Manage Users" })).toBeNull();
  });

  it("shows Invoice Settings to staff who can read them", () => {
    writeSession({
      ...session,
      account: {
        ...session.account,
        pharmacyRole: "staff",
        permissions: ["invoice-settings:read"],
      },
    });
    renderAt("/dashboard");
    expect(screen.getByRole("button", { name: "Invoice Settings" })).toBeTruthy();
    expect(screen.getByText("Management")).toBeTruthy();
    expect(screen.queryByRole("button", { name: "Manage Users" })).toBeNull();
  });

  it("sends pharmacy staff without invoice-settings:read away from Invoice Settings", () => {
    writeSession({
      ...session,
      account: {
        ...session.account,
        pharmacyRole: "staff",
        permissions: ["invoice-settings:update"],
      },
    });
    renderAt("/invoice-settings");
    expect(screen.getByText("Loading dashboard")).toBeTruthy();
    expect(screen.queryByRole("button", { name: "Invoice Settings" })).toBeNull();
  });

  it("shows Distributors to staff who can read them", () => {
    writeSession({
      ...session,
      account: { ...session.account, pharmacyRole: "staff", permissions: ["distributors:read"] },
    });
    renderAt("/dashboard");
    expect(screen.getByRole("button", { name: "Distributors" })).toBeTruthy();
    expect(screen.getByText("Catalogue")).toBeTruthy();
    expect(screen.queryByRole("button", { name: "Manage Users" })).toBeNull();
  });

  it("sends pharmacy staff without distributors:read away from Distributors", () => {
    writeSession({
      ...session,
      account: { ...session.account, pharmacyRole: "staff", permissions: ["distributors:create"] },
    });
    renderAt("/distributors");
    expect(screen.getByText("Loading dashboard")).toBeTruthy();
    expect(screen.queryByRole("button", { name: "Distributors" })).toBeNull();
  });

  it("shows Purchases to staff who can read them", () => {
    writeSession({
      ...session,
      account: { ...session.account, pharmacyRole: "staff", permissions: ["purchases:read"] },
    });
    renderAt("/dashboard");
    expect(screen.getByRole("button", { name: "Purchases" })).toBeTruthy();
    expect(screen.getByText("Catalogue")).toBeTruthy();
  });

  it("sends pharmacy staff without purchases:read away from Purchases", () => {
    writeSession({
      ...session,
      account: { ...session.account, pharmacyRole: "staff", permissions: ["purchases:create"] },
    });
    renderAt("/purchases");
    expect(screen.getByText("Loading dashboard")).toBeTruthy();
    expect(screen.queryByRole("button", { name: "Purchases" })).toBeNull();
  });

  it("shows Inventory to staff who can read it", () => {
    writeSession({
      ...session,
      account: { ...session.account, pharmacyRole: "staff", permissions: ["inventory:read"] },
    });
    renderAt("/dashboard");
    expect(screen.getByRole("button", { name: "Inventory" })).toBeTruthy();
    expect(screen.getByText("Catalogue")).toBeTruthy();
  });

  it("sends pharmacy staff without inventory:read away from Inventory", () => {
    writeSession({
      ...session,
      account: { ...session.account, pharmacyRole: "staff", permissions: ["inventory:update"] },
    });
    renderAt("/inventory");
    expect(screen.getByText("Loading dashboard")).toBeTruthy();
    expect(screen.queryByRole("button", { name: "Inventory" })).toBeNull();
  });

  it("shows Offers to staff who can read them", () => {
    writeSession({
      ...session,
      account: { ...session.account, pharmacyRole: "staff", permissions: ["offers:read"] },
    });
    renderAt("/dashboard");
    expect(screen.getByRole("button", { name: "Offers" })).toBeTruthy();
    expect(screen.getByText("Catalogue")).toBeTruthy();
  });

  it("sends pharmacy staff without offers:read away from Offers", () => {
    writeSession({
      ...session,
      account: { ...session.account, pharmacyRole: "staff", permissions: ["offers:create"] },
    });
    renderAt("/offers");
    expect(screen.getByText("Loading dashboard")).toBeTruthy();
    expect(screen.queryByRole("button", { name: "Offers" })).toBeNull();
  });

  it("shows Billing to staff who can read it", () => {
    writeSession({
      ...session,
      account: { ...session.account, pharmacyRole: "staff", permissions: ["billing:read"] },
    });
    renderAt("/dashboard");
    const nav = document.querySelector("[data-slot=nav]");
    const names = within(nav as HTMLElement)
      .getAllByRole("button")
      .map((button) => button.textContent?.trim());
    expect(names[0]).toBe("Dashboard");
    expect(names[1]).toBe("Billing");
    expect(screen.getByText("Counter")).toBeTruthy();
  });

  it("shows Sales to staff who can read it", () => {
    writeSession({
      ...session,
      account: { ...session.account, pharmacyRole: "staff", permissions: ["sales:read"] },
    });
    renderAt("/dashboard");
    const nav = document.querySelector("[data-slot=nav]");
    const names = within(nav as HTMLElement)
      .getAllByRole("button")
      .map((button) => button.textContent?.trim());
    expect(names[0]).toBe("Dashboard");
    expect(names[1]).toBe("Sales");
    expect(screen.getByText("Counter")).toBeTruthy();
  });

  it("shows CRM - Patients to staff who can read it", () => {
    writeSession({
      ...session,
      account: { ...session.account, pharmacyRole: "staff", permissions: ["patients:read"] },
    });
    renderAt("/dashboard");
    const nav = document.querySelector("[data-slot=nav]");
    const names = within(nav as HTMLElement)
      .getAllByRole("button")
      .map((button) => button.textContent?.trim());
    expect(names[0]).toBe("Dashboard");
    expect(names[1]).toBe("CRM - Patients");
    expect(screen.getByText("Counter")).toBeTruthy();
  });

  it("sends pharmacy staff without patients:read away from CRM - Patients", () => {
    writeSession({
      ...session,
      account: { ...session.account, pharmacyRole: "staff", permissions: ["patients:update"] },
    });
    renderAt("/patients");
    expect(screen.getByText("Loading dashboard")).toBeTruthy();
    expect(screen.queryByRole("button", { name: "CRM - Patients" })).toBeNull();
  });

  it("sends pharmacy staff without sales:read away from Sales", () => {
    writeSession({
      ...session,
      account: { ...session.account, pharmacyRole: "staff", permissions: ["sales:return"] },
    });
    renderAt("/sales");
    expect(screen.getByText("Loading dashboard")).toBeTruthy();
    expect(screen.queryByRole("button", { name: "Sales" })).toBeNull();
  });

  it("sends pharmacy staff without billing:read away from Billing", () => {
    writeSession({
      ...session,
      account: { ...session.account, pharmacyRole: "staff", permissions: ["billing:create"] },
    });
    renderAt("/billing");
    expect(screen.getByText("Loading dashboard")).toBeTruthy();
    expect(screen.queryByRole("button", { name: "Billing" })).toBeNull();
  });

  it("shows Rack & Locations to staff who can read it", () => {
    writeSession({
      ...session,
      account: { ...session.account, pharmacyRole: "staff", permissions: ["racks:read"] },
    });
    renderAt("/dashboard");
    expect(screen.getByRole("button", { name: "Rack & Locations" })).toBeTruthy();
    expect(screen.getByText("Catalogue")).toBeTruthy();
  });

  it("sends pharmacy staff without racks:read away from Rack & Locations", () => {
    writeSession({
      ...session,
      account: { ...session.account, pharmacyRole: "staff", permissions: ["racks:create"] },
    });
    renderAt("/racks");
    expect(screen.getByText("Loading dashboard")).toBeTruthy();
    expect(screen.queryByRole("button", { name: "Rack & Locations" })).toBeNull();
  });

  it("shows Rack & Locations to staff who can read it", () => {
    writeSession({
      ...session,
      account: { ...session.account, pharmacyRole: "staff", permissions: ["racks:read"] },
    });
    renderAt("/dashboard");
    expect(screen.getByRole("button", { name: "Rack & Locations" })).toBeTruthy();
    expect(screen.getByText("Catalogue")).toBeTruthy();
  });

  it("sends pharmacy staff without racks:read away from Rack & Locations", () => {
    writeSession({
      ...session,
      account: { ...session.account, pharmacyRole: "staff", permissions: ["racks:create"] },
    });
    renderAt("/racks");
    expect(screen.getByText("Loading dashboard")).toBeTruthy();
    expect(screen.queryByRole("button", { name: "Rack & Locations" })).toBeNull();
  });

  it("sends pharmacy staff without employees:read away from Employees", () => {
    writeSession({
      ...session,
      account: { ...session.account, pharmacyRole: "staff", permissions: ["employees:create"] },
    });
    renderAt("/employees");
    expect(screen.getByText("Loading dashboard")).toBeTruthy();
    expect(screen.queryByRole("button", { name: "Employees" })).toBeNull();
  });

  it("shows Expenses to staff who can read them", () => {
    writeSession({
      ...session,
      account: { ...session.account, pharmacyRole: "staff", permissions: ["expenses:read"] },
    });
    renderAt("/dashboard");
    expect(screen.getByRole("button", { name: "Expenses" })).toBeTruthy();
    expect(screen.getByText("Business")).toBeTruthy();
  });

  it("sends pharmacy staff without expenses:read away from Expenses", () => {
    writeSession({
      ...session,
      account: { ...session.account, pharmacyRole: "staff", permissions: ["expenses:create"] },
    });
    renderAt("/expenses");
    expect(screen.getByText("Loading dashboard")).toBeTruthy();
    expect(screen.queryByRole("button", { name: "Expenses" })).toBeNull();
  });

  it("shows Reports to staff who can read them", () => {
    writeSession({
      ...session,
      account: { ...session.account, pharmacyRole: "staff", permissions: ["reports:read"] },
    });
    renderAt("/dashboard");
    expect(screen.getByRole("button", { name: "Reports" })).toBeTruthy();
    expect(screen.getByText("Business")).toBeTruthy();
    expect(screen.queryByRole("button", { name: "Expenses" })).toBeNull();
  });

  it("sends pharmacy staff without reports:read away from Reports", () => {
    writeSession({
      ...session,
      account: { ...session.account, pharmacyRole: "staff", permissions: ["reports:export"] },
    });
    renderAt("/reports");
    expect(screen.getByText("Loading dashboard")).toBeTruthy();
    expect(screen.queryByRole("button", { name: "Reports" })).toBeNull();
  });

  it("sends pharmacy staff without reports:read away from a report", () => {
    writeSession({
      ...session,
      account: { ...session.account, pharmacyRole: "staff", permissions: ["reports:export"] },
    });
    renderAt("/reports/gstr1");
    expect(screen.getByText("Loading dashboard")).toBeTruthy();
    expect(screen.queryByRole("button", { name: "Reports" })).toBeNull();
  });

  it("sends pharmacy staff away from Profile", () => {
    writeSession({
      ...session,
      account: { ...session.account, pharmacyRole: "staff" },
    });
    renderAt("/profile");
    expect(screen.getByText("Loading dashboard")).toBeTruthy();
    expect(screen.queryByRole("button", { name: "Profile" })).toBeNull();
  });
});
