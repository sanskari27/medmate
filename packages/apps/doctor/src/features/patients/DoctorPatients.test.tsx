import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import "@testing-library/jest-dom/vitest";
import { Provider } from "react-redux";
import { MemoryRouter } from "react-router-dom";
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
      lastSeen: "Dr. Meghana Iyer",
    },
    {
      id: "patient-2",
      name: "Rahul Sharma",
      age: 45,
      sex: "M",
      phone: "••••• 12345",
      status: "with-doctor",
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
      conditions: "Asthma",
      allergies: "Dust",
      abha: true,
      lastSeen: "Dr. Ananya Rao",
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

function renderPatientList(
  patients: typeof patientsWithClinical,
  path = "/patients",
  captured?: { url: string },
) {
  writeSession(session);
  const fetch = vi.fn(async (input: RequestInfo | URL) => {
    const url = requestUrl(input);
    if (captured) captured.url = url;
    const parsed = new URL(url, "http://localhost");
    if (parsed.pathname.includes("/clinic-api/clinic/me")) return json(meDoctor);
    if (parsed.pathname.includes("/clinic-api/clinic/patients")) return json(patients);
    return json({});
  });
  vi.stubGlobal("fetch", fetch as unknown as typeof fetch);
  return render(
    <Provider store={createAppStore()}>
      <MemoryRouter initialEntries={[path]}>
        <PatientListPage />
      </MemoryRouter>
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
    renderPatientList(patientsWithClinical);
    await waitFor(() => expect(screen.getByText("Anjali Menon")).toBeInTheDocument());
    await waitFor(() => expect(screen.getByText("Rahul Sharma")).toBeInTheDocument());
    await waitFor(() => expect(screen.getByText("Priya Patel")).toBeInTheDocument());
  });

  it("search filters by name", async () => {
    const captured = { url: "" };
    renderPatientList(patientsWithClinical, "/patients", captured);
    await waitFor(() => expect(screen.getByText("Anjali Menon")).toBeInTheDocument());

    const searchInput = screen.getByPlaceholderText(/search/i);
    fireEvent.change(searchInput, { target: { value: "Anjali" } });
    await waitFor(() => expect(captured.url).toContain("q=Anjali"));
  });

  it("status and due filters are sent as query parameters", async () => {
    const captured = { url: "" };
    renderPatientList(patientsWithClinical, "/patients", captured);
    await waitFor(() => expect(screen.getByText("Anjali Menon")).toBeInTheDocument());

    const statusSelect = screen.getByRole("combobox", { name: /status/i });
    fireEvent.change(statusSelect, { target: { value: "waiting" } });
    await waitFor(() => expect(captured.url).toContain("status=waiting"));

    const dueSelect = screen.getByRole("combobox", { name: /due/i });
    fireEvent.change(dueSelect, { target: { value: "true" } });
    await waitFor(() => expect(captured.url).toContain("due=true"));
  });

  it("opens with the filter a link to the patient list carries", async () => {
    const captured = { url: "" };
    renderPatientList(patientsWithClinical, "/patients?status=waiting", captured);
    await waitFor(() => expect(captured.url).toContain("status=waiting"));
    expect(screen.getByRole("combobox", { name: /status/i })).toHaveValue("waiting");
  });

  it("an empty clinic renders an empty state and not an error", async () => {
    renderPatientList(emptyPatients);
    await waitFor(() => expect(screen.getByText("No patients")).toBeInTheDocument());
    expect(screen.queryByText(/error/i)).not.toBeInTheDocument();
  });

  it("every row shows a masked phone", async () => {
    renderPatientList(patientsWithClinical);
    await waitFor(() => expect(screen.getByText("••••• 28051")).toBeInTheDocument());
    await waitFor(() => expect(screen.getByText("••••• 12345")).toBeInTheDocument());
    await waitFor(() => expect(screen.getByText("••••• 67890")).toBeInTheDocument());
  });

  it("a row shows the patient's own detail inline", async () => {
    renderPatientList(patientsWithClinical);
    await waitFor(() => expect(screen.getByText("Hypertension")).toBeInTheDocument());
    await waitFor(() => expect(screen.getByText("Penicillin")).toBeInTheDocument());
    await waitFor(() => expect(screen.getByText("Diabetes")).toBeInTheDocument());
    // ABHA badge - two patients have ABHA
    expect(screen.getAllByText(/ABHA/i)).toHaveLength(2);
  });

  it("a row names the doctor who last saw the patient", async () => {
    renderPatientList(patientsWithClinical);
    await waitFor(() =>
      expect(screen.getByText("Last seen by Dr. Meghana Iyer")).toBeInTheDocument(),
    );
    await waitFor(() =>
      expect(screen.getByText("Last seen by Dr. Ananya Rao")).toBeInTheDocument(),
    );
    // A patient nobody has seen yet carries no last seen doctor.
    expect(screen.queryByText(/Last seen by Rahul/)).not.toBeInTheDocument();
  });
});
