import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { Provider } from "react-redux";
import { afterEach, describe, expect, it, vi } from "vitest";
import { createAppStore } from "@/app/store";
import { writeSession } from "@/services/storage";
import type { Session } from "@/types";
import { DepartmentsPage } from "./DepartmentsPage";

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
    pharmacyType: "hospital",
    verificationStatus: "approved",
    rejection: null,
    subtypes: [],
    permissions: [],
    pinSetupRequired: false,
  },
};

const list = {
  departments: [
    {
      id: "card",
      name: "Cardiology",
      code: "CARD",
      description: "Heart",
      isActive: true,
      displayOrder: 1,
      parent: { id: "med", name: "Medicine", code: "MED" },
    },
    {
      id: "med",
      name: "Medicine",
      code: "MED",
      description: null,
      isActive: false,
      displayOrder: 2,
      parent: null,
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
      <DepartmentsPage />
    </Provider>,
  );
}

afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
  sessionStorage.clear();
});

describe("DepartmentsPage", () => {
  it("lists name, code, parent, order, and status", async () => {
    renderPage();
    expect(await screen.findByRole("button", { name: "Cardiology" })).toBeTruthy();
    expect(screen.getByRole("columnheader", { name: "Name" })).toBeTruthy();
    expect(screen.getByRole("columnheader", { name: "Code" })).toBeTruthy();
    expect(screen.getByRole("columnheader", { name: "Parent" })).toBeTruthy();
    expect(screen.getByRole("columnheader", { name: "Order" })).toBeTruthy();
    expect(screen.getByRole("columnheader", { name: "Status" })).toBeTruthy();
    expect(screen.getByText("CARD")).toBeTruthy();
    expect(screen.getAllByText("Medicine").length).toBeGreaterThan(0);
    expect(screen.getByText("—")).toBeTruthy();
  });

  it("hides Add department when staff can only read", async () => {
    renderPage("staff", ["departments:read"]);
    expect(await screen.findByText("Cardiology")).toBeTruthy();
    expect(screen.queryByRole("button", { name: "Add department" })).toBeNull();
  });

  it("hides editing when staff cannot update", async () => {
    renderPage("staff", ["departments:read"]);
    expect(await screen.findByText("Cardiology")).toBeTruthy();
    expect(screen.queryByRole("button", { name: "Cardiology" })).toBeNull();
    expect(screen.queryByRole("dialog")).toBeNull();
  });

  it("omits a department and its descendants from the parent list", async () => {
    renderPage();
    fireEvent.click(await screen.findByRole("button", { name: "Medicine" }));
    const dialog = screen.getByRole("dialog", { name: "Edit department" });
    const parent = dialog.querySelector("#department-parent") as HTMLSelectElement;
    const labels = [...parent.options].map((option) => option.textContent);
    expect(labels).toEqual(["No parent"]);
    expect(screen.getByRole("button", { name: "Save department" })).toHaveProperty(
      "disabled",
      false,
    );
  });
});
