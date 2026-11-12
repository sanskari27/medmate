import { cleanup, fireEvent, render, screen, within } from "@testing-library/react";
import { Provider } from "react-redux";
import { afterEach, describe, expect, it, vi } from "vitest";
import { createAppStore } from "@/app/store";
import { writeSession } from "@/services/storage";
import type { Session } from "@/types";
import { EmployeesPage } from "./EmployeesPage";

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
  workplace: {
    name: "Sri Sai Medicals",
    tagline: "Care nearby",
    address: "12 MG Road",
    city: "Bengaluru",
    state: "Karnataka",
    phone: "+919876543210",
    logoUrl: null,
  },
  employees: [
    {
      id: "EMP-001",
      name: "Anjali Menon",
      position: "Pharmacist",
      department: "Dispensing",
      phone: "9886012345",
      email: null,
      address: null,
      dob: null,
      joinedOn: "2026-11-12",
      employment: "Full-time",
      salary: 0,
      status: "active",
      pan: null,
      aadhaar: null,
      bankName: null,
      accountName: null,
      accountNumber: null,
      ifsc: null,
      upi: null,
      emergencyName: null,
      emergencyPhone: null,
      note: null,
      bloodGroup: null,
      photo: null,
      documents: [],
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
      <EmployeesPage />
    </Provider>,
  );
}

afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
  sessionStorage.clear();
});

describe("EmployeesPage", () => {
  it("opens Add Employee with the form sections and a disabled save", async () => {
    renderPage();
    expect(await screen.findByText("Anjali Menon")).toBeTruthy();
    fireEvent.click(screen.getByRole("button", { name: "Add Employee" }));
    const dialog = screen.getByRole("dialog", { name: "Add Employee" });
    const headings = [...dialog.querySelectorAll("h4")].map((heading) => heading.textContent);
    expect(headings).toEqual([
      "Personal",
      "Employment",
      "Statutory IDs",
      "Documents",
      "Salary bank account",
      "Emergency contact",
      "Notes",
    ]);
    expect(screen.getByRole("button", { name: "Add employee" })).toHaveProperty("disabled", true);
  });

  it("hides Add Employee when staff can only read", async () => {
    renderPage("staff", ["employees:read"]);
    expect(await screen.findByText("Anjali Menon")).toBeTruthy();
    expect(screen.queryByRole("button", { name: "Add Employee" })).toBeNull();
  });

  it("disables Inactive when staff can update but not delete", async () => {
    renderPage("staff", ["employees:read", "employees:update"]);
    fireEvent.click(await screen.findByText("Anjali Menon"));
    const status = within(screen.getByRole("dialog")).getByLabelText("Status") as HTMLSelectElement;
    const inactive = [...status.options].find((option) => option.value === "inactive");
    expect(inactive?.disabled).toBe(true);
  });
});
