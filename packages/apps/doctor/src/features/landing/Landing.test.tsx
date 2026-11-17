import { cleanup, render, screen, waitFor } from "@testing-library/react";
import "@testing-library/jest-dom/vitest";
import { Provider } from "react-redux";
import { MemoryRouter } from "react-router-dom";
import { afterEach, describe, expect, it, vi } from "vitest";
import { createAppStore } from "@/app/store";
import { writeSession } from "@/services/storage";
import type { Session } from "@/types";
import { LandingPage } from "./components/LandingPage";

const session: Session = {
  accessToken: "access-token",
  refreshToken: "refresh-token",
  expiresIn: 900,
};

const meDoctor = {
  clinicId: "clinic-1",
  clinicName: "City Clinic",
  role: "doctor",
  grants: ["clinic:patients:read", "clinic:patients:read_clinical"],
};

const meNurse = {
  clinicId: "clinic-1",
  clinicName: "City Clinic",
  role: "nurse",
  grants: ["clinic:patients:read", "clinic:patients:read_clinical"],
};

const meFrontDesk = {
  clinicId: "clinic-1",
  clinicName: "City Clinic",
  role: "front_desk",
  grants: ["clinic:patients:read", "clinic:billing:read"],
};

const meAdmin = {
  clinicId: "clinic-1",
  clinicName: "City Clinic",
  role: "admin",
  grants: ["clinic:patients:read", "clinic:patients:read_clinical", "clinic:billing:read", "clinic:staff:read"],
};

const patientsWithClinical = {
  items: [
    {
      id: "patient-1",
      name: "Anjali Menon",
      age: 34,
      sex: "F",
      phone: "••••• 28051",
      status: "waiting",
      conditions: "Hypertension",
      allergies: "Penicillin",
      abha: true,
      lastSeen: "2026-11-15T10:30:00Z",
    },
    {
      id: "patient-2",
      name: "Rahul Sharma",
      age: 45,
      sex: "M",
      phone: "••••• 12345",
      status: "with-doctor",
      conditions: "Diabetes",
      allergies: "",
      abha: false,
      lastSeen: "2026-11-14T14:20:00Z",
    },
  ],
  page: 1,
  size: 25,
  total: 2,
};

const patientsWithDue = {
  items: [
    {
      id: "patient-1",
      name: "Anjali Menon",
      age: 34,
      sex: "F",
      phone: "••••• 28051",
      status: "waiting",
      conditions: "Hypertension",
      allergies: "Penicillin",
      abha: true,
      lastSeen: "2026-11-15T10:30:00Z",
      due: 500,
    },
    {
      id: "patient-2",
      name: "Rahul Sharma",
      age: 45,
      sex: "M",
      phone: "••••• 12345",
      status: "seen",
      conditions: "Diabetes",
      allergies: "",
      abha: false,
      lastSeen: "2026-11-14T14:20:00Z",
      due: 0,
    },
  ],
  page: 1,
  size: 25,
  total: 2,
};

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "content-type": "application/json" },
  });
}

function requestUrl(input: RequestInfo | URL): string {
  if (typeof input === "string") return input;
  if (input instanceof URL) return input.toString();
  return input.url;
}

function renderLanding(me: typeof meDoctor, patients: typeof patientsWithClinical, sessionOverrides: Partial<Session> = {}) {
  writeSession({ ...session, ...sessionOverrides });
  const fetch = vi.fn(async (input: RequestInfo | URL) => {
    const url = requestUrl(input);
    if (url.includes("/clinic-api/clinic/me")) return json(me);
    if (url.includes("/clinic-api/clinic/patients")) return json(patients);
    return json({});
  });
  vi.stubGlobal("fetch", fetch as unknown as typeof fetch);
  return render(
    <Provider store={createAppStore()}>
      <MemoryRouter initialEntries={["/"]}>
        <LandingPage />
      </MemoryRouter>
    </Provider>,
  );
}

afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
  sessionStorage.clear();
});

describe("LandingPage", () => {
  it("a doctor account lands on a screen whose headline is the doctor's own summary", async () => {
    renderLanding(meDoctor, patientsWithClinical);
    await waitFor(() => expect(screen.getByText(/your patients/i)).toBeInTheDocument());
    expect(screen.getByText(/waiting/i)).toBeInTheDocument();
    expect(screen.getByText(/with doctor/i)).toBeInTheDocument();
    expect(screen.getByText(/seen/i)).toBeInTheDocument();
  });

it("a nurse lands on the patients needing attention", async () => {
    renderLanding(meNurse, patientsWithClinical);
    await waitFor(() => expect(screen.getByText(/needing attention/i)).toBeInTheDocument());
    expect(screen.getByText(/waiting/i)).toBeInTheDocument();
    expect(screen.getByText(/with doctor/i)).toBeInTheDocument();
  });

  it("a front desk account lands on who is waiting and what is owed", async () => {
    renderLanding(meFrontDesk, patientsWithDue);
    await waitFor(() => expect(screen.getByText(/waiting/i)).toBeInTheDocument());
    expect(screen.getByText(/with doctor/i)).toBeInTheDocument();
    expect(screen.getByText(/amount due/i)).toBeInTheDocument();
  });

  it("an admin lands on the clinic's patients", async () => {
    renderLanding(meAdmin, patientsWithClinical);
    await waitFor(() => expect(screen.getByText(/clinic patients/i)).toBeInTheDocument());
    expect(screen.getByText(/waiting/i)).toBeInTheDocument();
    expect(screen.getByText(/with doctor/i)).toBeInTheDocument();
    expect(screen.getByText(/seen/i)).toBeInTheDocument();
  });

  it("shows no amount when the account lacks clinic:billing:read", async () => {
    renderLanding(meDoctor, patientsWithClinical);
    await waitFor(() => expect(screen.queryByText(/₹/i)).not.toBeInTheDocument());
    expect(screen.queryByText(/owed/i)).not.toBeInTheDocument();
  });
});