import { cleanup, render, screen, waitFor, within } from "@testing-library/react";
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
  grants: [
    "clinic:patients:read",
    "clinic:patients:read_clinical",
    "clinic:billing:read",
    "clinic:staff:read",
  ],
};

const clinicPatients = [
  {
    id: "patient-1",
    name: "Anjali Menon",
    age: 34,
    sex: "F",
    phone: "••••• 28051",
    status: "waiting",
    due: 500,
    conditions: "Hypertension",
    allergies: "Penicillin",
    abha: true,
    lastSeen: "Dr. Meghana Iyer",
  },
  {
    id: "patient-2",
    name: "Rahul Sharma",
    age: 45,
    sex: "M",
    phone: "••••• 12345",
    status: "with-doctor",
    due: 0,
    conditions: "Diabetes",
    allergies: null,
    abha: false,
    lastSeen: null,
  },
  {
    id: "patient-3",
    name: "Priya Patel",
    age: 28,
    sex: "F",
    phone: "••••• 67890",
    status: "seen",
    due: 0,
    conditions: "Asthma",
    allergies: "Dust",
    abha: true,
    lastSeen: "Dr. Ananya Rao",
  },
  {
    id: "patient-4",
    name: "Kiran Menon",
    age: 60,
    sex: "M",
    phone: "••••• 11111",
    status: "inactive",
    due: 250,
    conditions: "Diabetes, High BP",
    allergies: "Sulfa drugs",
    abha: false,
    lastSeen: null,
  },
];

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

/** The patient list answers with the rows the query asks for, and their real total. */
function patientPage(url: URL) {
  const status = url.searchParams.get("status");
  const due = url.searchParams.get("due");
  const size = Number(url.searchParams.get("size") ?? "25");
  let items = clinicPatients;
  if (status) items = items.filter((patient) => patient.status === status);
  if (due === "true") items = items.filter((patient) => patient.due > 0);
  if (due === "false") items = items.filter((patient) => patient.due === 0);
  return { items: items.slice(0, size), page: 1, size, total: items.length };
}

function renderLanding(me: typeof meDoctor) {
  writeSession(session);
  const fetch = vi.fn(async (input: RequestInfo | URL) => {
    const url = new URL(requestUrl(input), "http://localhost");
    if (url.pathname.includes("/clinic-api/clinic/me")) return json(me);
    if (url.pathname.includes("/clinic-api/clinic/patients")) return json(patientPage(url));
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
    renderLanding(meDoctor);
    await waitFor(() => expect(screen.getByText("Your patients")).toBeInTheDocument());
    expect(screen.getByText("Waiting")).toBeInTheDocument();
    expect(screen.getByText("With doctor")).toBeInTheDocument();
    expect(screen.getByText("Seen")).toBeInTheDocument();
  });

  it("a nurse lands on the patients needing attention", async () => {
    renderLanding(meNurse);
    await waitFor(() => expect(screen.getByText("Patients needing you")).toBeInTheDocument());
    await waitFor(() => expect(screen.getByText("Needing attention")).toBeInTheDocument());
    expect(screen.getByText("Waiting")).toBeInTheDocument();
    expect(screen.getByText("With doctor")).toBeInTheDocument();
  });

  it("a front desk account lands on who is waiting and what is owed", async () => {
    renderLanding(meFrontDesk);
    await waitFor(() => expect(screen.getByText("Waiting")).toBeInTheDocument());
    expect(screen.getByText("With doctor")).toBeInTheDocument();
    expect(screen.getByText("Amount due")).toBeInTheDocument();
  });

  it("an admin lands on the clinic's patients", async () => {
    renderLanding(meAdmin);
    await waitFor(() => expect(screen.getByText("The clinic today")).toBeInTheDocument());
    expect(screen.getByText("Clinic patients")).toBeInTheDocument();
    expect(screen.getByText("Waiting")).toBeInTheDocument();
    expect(screen.getByText("With doctor")).toBeInTheDocument();
    expect(screen.getByText("Seen")).toBeInTheDocument();
  });

  it("counts the patients of the whole clinic, not of one page", async () => {
    renderLanding(meDoctor);
    await waitFor(() => expect(screen.getByText("Patients")).toBeInTheDocument());
    const patientsStat = screen.getByRole("button", { name: "View Patients" });
    expect(within(patientsStat).getByText("4")).toBeInTheDocument();
    const waitingStat = screen.getByRole("button", { name: "View Waiting" });
    expect(within(waitingStat).getByText("1")).toBeInTheDocument();
  });

  it("shows the outstanding amount to an account holding clinic:billing:read", async () => {
    renderLanding(meFrontDesk);
    await waitFor(() => expect(screen.getByText("Amount due")).toBeInTheDocument());
    await waitFor(() => expect(screen.getByText("₹750")).toBeInTheDocument());
  });

  it("shows no amount when the account lacks clinic:billing:read", async () => {
    renderLanding(meDoctor);
    await waitFor(() => expect(screen.getByText("Waiting")).toBeInTheDocument());
    expect(screen.queryByText(/₹/)).not.toBeInTheDocument();
    expect(screen.queryByText("Amount due")).not.toBeInTheDocument();
  });
});
