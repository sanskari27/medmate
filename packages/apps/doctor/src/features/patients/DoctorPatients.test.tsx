import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import "@testing-library/jest-dom/vitest";
import { Provider } from "react-redux";
import { afterEach, describe, expect, it, vi } from "vitest";
import { createAppStore } from "@/app/store";
import { writeSession } from "@/services/storage";
import type { Session } from "@/types";
import { PatientListPage } from "./components/PatientList/PatientListPage";

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
    {
      id: "patient-3",
      name: "Priya Patel",
      age: 28,
      sex: "F",
      phone: "••••• 67890",
      status: "seen",
      conditions: "Asthma",
      allergies: "Dust",
      abha: true,
      lastSeen: "2026-11-13T09:15:00Z",
    },
  ],
  page: 1,
  size: 25,
  total: 3,
};

const emptyPatients = {
  items: [],
  page: 1,
  size: 25,
  total: 0,
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

function renderPatientList(me: typeof meDoctor, patients: typeof patientsWithClinical, sessionOverrides: Partial<Session> = {}) {
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
      <PatientListPage />
    </Provider>,
  );
}

afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
  sessionStorage.clear();
});

describe("PatientListPage", () => {
  it("renders the patients of the signed-in clinic", async () => {
    renderPatientList(meDoctor, patientsWithClinical);
    await waitFor(() => expect(screen.getByText("Anjali Menon")).toBeInTheDocument());
    await waitFor(() => expect(screen.getByText("Rahul Sharma")).toBeInTheDocument());
    await waitFor(() => expect(screen.getByText("Priya Patel")).toBeInTheDocument());
  });

  it("search filters by name", async () => {
    let capturedUrl = "";
    const fetch = vi.fn(async (input: RequestInfo | URL) => {
      capturedUrl = requestUrl(input);
      const url = new URL(capturedUrl, "http://localhost");
      if (url.pathname.includes("/clinic-api/clinic/me")) return json(meDoctor);
      if (url.pathname.includes("/clinic-api/clinic/patients")) return json(patientsWithClinical);
      return json({});
    });
    writeSession(session);
    vi.stubGlobal("fetch", fetch as unknown as typeof fetch);
    render(
      <Provider store={createAppStore()}>
        <PatientListPage />
      </Provider>,
    );
    await waitFor(() => expect(screen.getByText("Anjali Menon")).toBeInTheDocument());

    const searchInput = screen.getByPlaceholderText(/search/i);
    fireEvent.change(searchInput, { target: { value: "Anjali" } });
    await waitFor(() => expect(capturedUrl).toContain("q=Anjali"));
  });

  it("status and due filters are sent as query parameters", async () => {
    let capturedUrl = "";
    const fetch = vi.fn(async (input: RequestInfo | URL) => {
      capturedUrl = requestUrl(input);
      const url = new URL(capturedUrl, "http://localhost");
      if (url.pathname.includes("/clinic-api/clinic/me")) return json(meDoctor);
      if (url.pathname.includes("/clinic-api/clinic/patients")) return json(patientsWithClinical);
      return json({});
    });
    writeSession(session);
    vi.stubGlobal("fetch", fetch as unknown as typeof fetch);
    render(
      <Provider store={createAppStore()}>
        <PatientListPage />
      </Provider>,
    );
    await waitFor(() => expect(screen.getByText("Anjali Menon")).toBeInTheDocument());

    const statusSelect = screen.getByRole("combobox", { name: /status/i });
    fireEvent.change(statusSelect, { target: { value: "waiting" } });
    await waitFor(() => expect(capturedUrl).toContain("status=waiting"));

    const dueSelect = screen.getByRole("combobox", { name: /due/i });
    fireEvent.change(dueSelect, { target: { value: "true" } });
    await waitFor(() => expect(capturedUrl).toContain("due=true"));
  });

  it("an empty clinic renders an empty state and not an error", async () => {
    renderPatientList(meDoctor, emptyPatients);
    await waitFor(() => expect(screen.getByText("No patients")).toBeInTheDocument());
    expect(screen.queryByText(/error/i)).not.toBeInTheDocument();
  });

  it("every row shows a masked phone", async () => {
    renderPatientList(meDoctor, patientsWithClinical);
    await waitFor(() => expect(screen.getByText("••••• 28051")).toBeInTheDocument());
    await waitFor(() => expect(screen.getByText("••••• 12345")).toBeInTheDocument());
    await waitFor(() => expect(screen.getByText("••••• 67890")).toBeInTheDocument());
  });

  it("a row shows the patient's own detail inline", async () => {
    renderPatientList(meDoctor, patientsWithClinical);
    await waitFor(() => expect(screen.getByText("Hypertension")).toBeInTheDocument());
    await waitFor(() => expect(screen.getByText("Penicillin")).toBeInTheDocument());
    await waitFor(() => expect(screen.getByText("Diabetes")).toBeInTheDocument());
    // ABHA badge - two patients have ABHA
    expect(screen.getAllByText(/ABHA/i)).toHaveLength(2);
    // Last seen - three patients have last seen + one in sort dropdown
    expect(screen.getAllByText(/last seen/i)).toHaveLength(4);
  });
});