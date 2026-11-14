import { cleanup, fireEvent, render, screen, within } from "@testing-library/react";
import { Provider } from "react-redux";
import { afterEach, describe, expect, it, vi } from "vitest";
import { createAppStore } from "@/app/store";
import { writeSession } from "@/services/storage";
import type { Session } from "@/types";
import { WardsPage } from "./WardsPage";

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

const wards = {
  wards: [
    {
      id: "w1",
      name: "Orthopaedic Ward",
      code: "ORT",
      floor: "3rd floor",
      category: "Surgical",
      beds: 4,
      sister: "Sr. Meena",
      dailyRate: "1000.00",
      bedsHeld: 1,
      underMaintenance: false,
      maintenanceNote: null,
    },
  ],
};

const admissions = {
  admissions: [
    {
      id: "a1",
      name: "Asha Rao",
      uhid: "UHID-1",
      phone: null,
      age: 42,
      gender: "Female",
      wardId: "w1",
      wardName: "Orthopaedic Ward",
      bed: "ORT-1",
      doctor: "Dr. Iyer",
      diagnosis: "Fracture",
      payerType: "self",
      insurer: null,
      policyNo: null,
      admittedAt: "2026-11-14T00:00:00Z",
      status: "admitted",
      days: 1,
      dailyRate: "1000.00",
      outstanding: "1000.00",
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
    vi.fn(async (input: RequestInfo | URL) => {
      const url = typeof input === "string" ? input : input instanceof URL ? input.href : input.url;
      if (url.includes("/pharmacy/admissions")) return json(admissions);
      if (url.includes("/pharmacy/doctors")) return json({ doctors: [] });
      return json(wards);
    }),
  );
  return render(
    <Provider store={createAppStore()}>
      <WardsPage />
    </Provider>,
  );
}

afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
  sessionStorage.clear();
});

describe("WardsPage", () => {
  it("shows the pharmacy counts, bed map, and held bed", async () => {
    renderPage();
    expect(await screen.findByText("Orthopaedic Ward")).toBeTruthy();
    expect(screen.getByText("Wards")).toBeTruthy();
    expect(screen.getByText("Total beds")).toBeTruthy();
    expect(screen.getByText("Occupied")).toBeTruthy();
    expect(screen.getByText("Free")).toBeTruthy();
    expect(screen.getByText("Occupancy")).toBeTruthy();
    expect(screen.getByText("Admitted")).toBeTruthy();
    expect(screen.getByRole("button", { name: "Bed map" })).toBeTruthy();
    expect(screen.getByRole("button", { name: "Admissions (1)" })).toBeTruthy();
    expect(screen.getByRole("button", { name: /ORT-4/ })).toBeTruthy();
    expect(screen.getByText("Held")).toBeTruthy();
    expect(screen.getAllByText("+ Free").length).toBeGreaterThan(0);
  });

  it("opens ward setup as a list and an editor", async () => {
    renderPage();
    fireEvent.click(await screen.findByRole("button", { name: "Manage wards" }));
    const dialog = await screen.findByRole("dialog", { name: "Manage wards & beds" });
    const setup = within(dialog);
    expect(dialog.textContent).toContain("Edits save when you leave a field.");
    expect(setup.getByRole("button", { name: /Orthopaedic Ward/ })).toBeTruthy();
    expect((setup.getByLabelText("Ward name") as HTMLInputElement).value).toBe("Orthopaedic Ward");
    expect(setup.getByText("ORT-1")).toBeTruthy();
    expect(setup.getByText("The last bed is held and stays off the free list.")).toBeTruthy();
    fireEvent.click(setup.getByRole("button", { name: "New ward" }));
    expect((setup.getByLabelText("Ward name") as HTMLInputElement).value).toBe("");
    expect((setup.getByRole("button", { name: "Add ward" }) as HTMLButtonElement).disabled).toBe(
      true,
    );
  });

  it("hides Manage wards and Admit when staff can only read", async () => {
    renderPage("staff", ["wards:read"]);
    expect(await screen.findByText("Orthopaedic Ward")).toBeTruthy();
    expect(screen.queryByRole("button", { name: "Manage wards" })).toBeNull();
    expect(screen.queryByRole("button", { name: "Admit patient" })).toBeNull();
  });

  it("hides transfer and discharge without those keys", async () => {
    renderPage("staff", ["wards:read"]);
    fireEvent.click(await screen.findByRole("button", { name: /Asha/ }));
    const dialog = await screen.findByRole("dialog");
    expect(dialog.textContent).toContain("Asha Rao");
    expect(dialog.textContent).toContain("Outstanding");
    expect(screen.queryByRole("button", { name: /Transfer to/ })).toBeNull();
    expect(screen.queryByRole("button", { name: /discharge/i })).toBeNull();
  });
});
