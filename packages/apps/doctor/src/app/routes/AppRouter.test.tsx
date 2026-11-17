import { cleanup, render, screen, waitFor } from "@testing-library/react";
import "@testing-library/jest-dom/vitest";
import { Provider } from "react-redux";
import { createMemoryRouter, RouterProvider } from "react-router-dom";
import { afterEach, describe, expect, it, vi } from "vitest";
import { createAppStore } from "@/app/store";
import { routes } from "@/app/routes/AppRouter";
import { writeSession } from "@/services/storage";
import type { Session } from "@/types";

const session: Session = {
  accessToken: "access-token",
  refreshToken: "refresh-token",
  expiresIn: 900,
};

const meDoctor = {
  clinicId: "clinic-1",
  clinicName: "City Clinic",
  role: "doctor",
  grants: ["clinic:patients:read"],
};

const patients = {
  items: [
    {
      id: "patient-1",
      name: "Anjali Menon",
      age: 34,
      sex: "F",
      phone: "••••• 28051",
      status: "waiting",
    },
  ],
  page: 1,
  size: 25,
  total: 1,
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

function renderAt(path: string) {
  const router = createMemoryRouter(routes, { initialEntries: [path] });
  return render(
    <Provider store={createAppStore()}>
      <RouterProvider router={router} />
    </Provider>,
  );
}

beforeEach(() => {
  vi.stubGlobal(
    "fetch",
    vi.fn(async (input: RequestInfo | URL) => {
      const url = requestUrl(input);
      if (url.includes("/clinic-api/clinic/me")) return json(meDoctor);
      if (url.includes("/clinic-api/clinic/patients")) return json(patients);
      return json({});
    }),
  );
});

afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
  sessionStorage.clear();
});

describe("AppRouter", () => {
  it("sends a visitor with no session to the sign-in screen", async () => {
    renderAt("/");
    await waitFor(() => expect(screen.getByText(/log in to continue/i)).toBeInTheDocument());
    expect(screen.getByPlaceholderText("98860 12345")).toBeInTheDocument();
  });

  it("sends a signed-in visitor away from the sign-in screen", async () => {
    writeSession(session);
    renderAt("/login");
    await waitFor(() => expect(screen.getByText(/your patients/i)).toBeInTheDocument());
    expect(screen.queryByText(/log in to continue/i)).not.toBeInTheDocument();
  });

  it("keeps a signed-in visitor on the patient list", async () => {
    writeSession(session);
    renderAt("/patients");
    await waitFor(() => expect(screen.getByText("Anjali Menon")).toBeInTheDocument());
  });
});
