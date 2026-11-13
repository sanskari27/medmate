import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { Provider } from "react-redux";
import { MemoryRouter, Route, Routes, useParams } from "react-router-dom";
import { afterEach, describe, expect, it, vi } from "vitest";
import { createAppStore } from "@/app/store";
import { SESSION_STORAGE_KEY } from "@/constants";
import type { Session } from "@/types";
import { ReviewsPage } from "./ReviewsPage";

const session: Session = {
  accessToken: "access",
  refreshToken: "refresh",
  expiresIn: 900,
  account: {
    id: "account-id",
    accountType: "admin",
    phone: "+919876543210",
    displayName: "Ada",
    pharmacyId: null,
    pharmacyRole: null,
    verificationStatus: null,
    rejection: null,
    subtypes: [],
    permissions: [],
    pinSetupRequired: false,
  },
};

const older = {
  pharmacyId: "older",
  name: "Older Pharmacy",
  phone: "+919111111111",
  status: "pending_admin",
  submittedAt: "2026-11-01T10:00:00Z",
};

const newer = {
  pharmacyId: "newer",
  name: "Newer Pharmacy",
  phone: "+919222222222",
  status: "pending_compliance",
  submittedAt: "2026-11-10T10:00:00Z",
};

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

function Opened() {
  const { pharmacyId } = useParams();
  return <div>Opened {pharmacyId}</div>;
}

function renderPage() {
  sessionStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify({ session, pinReset: false }));
  return render(
    <Provider store={createAppStore()}>
      <MemoryRouter initialEntries={["/reviews"]}>
        <Routes>
          <Route path="/reviews" element={<ReviewsPage />} />
          <Route path="/reviews/:pharmacyId" element={<Opened />} />
        </Routes>
      </MemoryRouter>
    </Provider>,
  );
}

afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
  sessionStorage.clear();
});

describe("ReviewsPage", () => {
  it("lists both stages, oldest first", async () => {
    const urls: string[] = [];
    vi.stubGlobal(
      "fetch",
      vi.fn(async (input: RequestInfo) => {
        const url = requestUrl(input);
        urls.push(url);
        if (url.includes("/pharmacy-applications/") && !url.includes("?"))
          return json({ name: "Opened" });
        if (url.includes("/pharmacy-applications") && !url.includes("status=")) {
          return json({ applications: [older, newer], page: 1, size: 25, total: 2 });
        }
        return json({ detail: "Not found" }, 404);
      }),
    );

    renderPage();
    expect(await screen.findByRole("link", { name: "Older Pharmacy" })).toBeTruthy();
    const links = screen.getAllByRole("link");
    expect(links[0]?.getAttribute("aria-label")).toBe("Older Pharmacy");
    expect(links[1]?.getAttribute("aria-label")).toBe("Newer Pharmacy");
    expect(screen.getByText("Final review")).toBeTruthy();
    expect(screen.getByText("Compliance review")).toBeTruthy();
    const lists = urls.filter((url) => url.includes("/pharmacy-applications"));
    expect(lists).toHaveLength(1);
    expect(lists[0]?.includes("status=")).toBe(false);
    expect(screen.getByText("page 1 of 1")).toBeTruthy();
    expect(document.querySelector("time")?.getAttribute("dateTime")).toBe("2026-11-01T10:00:00Z");

    fireEvent.click(links[0]!);
    expect(await screen.findByText("Opened older")).toBeTruthy();
  });

  it("says when nothing is waiting", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async (input: RequestInfo) => {
        const url = requestUrl(input);
        if (url.includes("/pharmacy-applications") && !url.includes("status=")) {
          return json({ applications: [], page: 1, size: 25, total: 0 });
        }
        return json({ detail: "Not found" }, 404);
      }),
    );

    renderPage();
    expect(await screen.findByText("No applications are waiting for review.")).toBeTruthy();
  });

  it("shows a problem detail and no rows when a list fails", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async (input: RequestInfo) => {
        const url = requestUrl(input);
        if (url.includes("/pharmacy-applications")) {
          return json({ detail: "Status is required" }, 400);
        }
        return json({ detail: "Not found" }, 404);
      }),
    );

    renderPage();
    expect(await screen.findByText("Status is required")).toBeTruthy();
    expect(screen.queryByRole("link", { name: "Older Pharmacy" })).toBeNull();
  });
});
