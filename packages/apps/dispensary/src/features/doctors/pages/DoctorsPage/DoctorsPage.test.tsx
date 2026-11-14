import { cleanup, fireEvent, render, screen, within } from "@testing-library/react";
import { Provider } from "react-redux";
import { afterEach, describe, expect, it, vi } from "vitest";
import { createAppStore } from "@/app/store";
import { writeSession } from "@/services/storage";
import type { Session } from "@/types";
import { DoctorsPage } from "./DoctorsPage";

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
  doctors: [
    {
      id: "doc-1",
      code: "DR-ANU",
      firstName: "Anu",
      lastName: "Rao",
      displayName: "Dr Anu Rao",
      gender: "female",
      status: "active",
      registrationNumber: "KMC-1",
      registrationCouncil: null,
      registrationState: null,
      qualification: "MBBS",
      specialization: "General medicine",
      subSpecialization: null,
      yearsExperience: null,
      primaryMobile: "+919886011111",
      alternateMobile: null,
      email: null,
      whatsapp: null,
      relationshipStatus: "visiting",
      notes: null,
      workplaceName: "City Hospital",
      workplaceType: null,
      address: null,
      city: "Bengaluru",
      state: "Karnataka",
      pinCode: "560001",
      workplacePhone: null,
      photo: null,
      windows: [{ type: "offline", days: ["monday"], start: "09:00", end: "13:00", fee: "0.00" }],
      documents: [
        {
          id: "file-1",
          documentType: "Medical registration certificate",
          fileName: "certificate.pdf",
          contentType: "application/pdf",
          verificationStatus: "pending",
          url: "/pharmacy/doctors/doc-1/documents/file-1",
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
      <DoctorsPage />
    </Provider>,
  );
}

afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
  sessionStorage.clear();
});

describe("DoctorsPage", () => {
  it("opens Add doctor with the sections, a window, and document status", async () => {
    renderPage();
    expect(await screen.findByText("Dr Anu Rao")).toBeTruthy();
    fireEvent.click(screen.getByRole("button", { name: "Add doctor" }));
    const dialog = screen.getByRole("dialog", { name: "Add doctor" });
    const headings = [...dialog.querySelectorAll("h4")].map((heading) => heading.textContent);
    expect(headings).toEqual([
      "Basic",
      "Professional",
      "Contact",
      "Workplace",
      "Consultation",
      "Relationship",
      "Documents",
    ]);
    expect(within(dialog).getByLabelText("Consultation type 1")).toHaveProperty("value", "offline");
    expect(within(dialog).getByLabelText("Start 1")).toHaveProperty("value", "09:00");
    expect(within(dialog).getByLabelText("Verification status")).toHaveProperty("value", "pending");
    expect(within(dialog).queryByRole("button", { name: /remove document/i })).toBeNull();
    expect(screen.queryByLabelText("Doctor ID")).toBeNull();
    expect(screen.getByRole("button", { name: "Save doctor" })).toHaveProperty("disabled", true);
  });

  it("hides Add doctor when staff can only read", async () => {
    renderPage("staff", ["doctors:read"]);
    expect(await screen.findByText("Dr Anu Rao")).toBeTruthy();
    expect(screen.queryByRole("button", { name: "Add doctor" })).toBeNull();
  });

  it("hides editing when staff cannot update", async () => {
    renderPage("staff", ["doctors:read"]);
    expect(await screen.findByText("Dr Anu Rao")).toBeTruthy();
    expect(screen.queryByRole("button", { name: "Dr Anu Rao" })).toBeNull();
    expect(screen.queryByRole("dialog")).toBeNull();
  });

  it("keeps an inactive current department in the choices", async () => {
    writeSession(session);
    vi.stubGlobal(
      "fetch",
      vi.fn(async (input: RequestInfo | URL) => {
        const url = input instanceof Request ? input.url : String(input);
        if (url.includes("/pharmacy/departments")) {
          return json({
            departments: [
              {
                id: "card",
                name: "Cardiology",
                code: "CARD",
                description: null,
                isActive: true,
                displayOrder: 1,
                parent: null,
              },
              {
                id: "old",
                name: "Archive",
                code: "OLD",
                description: null,
                isActive: false,
                displayOrder: 2,
                parent: null,
              },
            ],
          });
        }
        return json({
          doctors: [
            {
              ...list.doctors[0],
              department: { id: "old", name: "Archive", code: "OLD", isActive: false },
            },
          ],
        });
      }),
    );
    render(
      <Provider store={createAppStore()}>
        <DoctorsPage />
      </Provider>,
    );
    fireEvent.click(await screen.findByRole("button", { name: "Dr Anu Rao" }));
    const department = screen.getByLabelText("Department") as HTMLSelectElement;
    expect([...department.options].map((option) => option.textContent)).toEqual([
      "No department",
      "Cardiology (CARD)",
      "Archive (OLD)",
    ]);
    expect(department.value).toBe("old");
    fireEvent.change(department, { target: { value: "" } });
    expect(department.value).toBe("");
  });
});
