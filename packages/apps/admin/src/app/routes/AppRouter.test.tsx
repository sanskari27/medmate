import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { Provider } from "react-redux";
import { MemoryRouter } from "react-router-dom";
import { afterEach, describe, expect, it, vi } from "vitest";
import { createAppStore } from "@/app/store";
import { SESSION_STORAGE_KEY } from "@/constants";
import type { Account, Session } from "@/types";
import { AppRouter } from "./AppRouter";

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
    pharmacyRole: "owner",
    verificationStatus: "approved",
    rejection: null,
    subtypes: [],
    permissions: [],
    pinSetupRequired: false,
  },
};

function renderAt(path: string) {
  return render(
    <Provider store={createAppStore()}>
      <MemoryRouter initialEntries={[path]}>
        <AppRouter />
      </MemoryRouter>
    </Provider>,
  );
}

function requestUrl(input: RequestInfo | URL) {
  if (typeof input === "string") return input;
  if (input instanceof URL) return input.toString();
  return input.url;
}

function account(overrides: Partial<Account> = {}): Account {
  return { ...session.account, ...overrides };
}

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "content-type": "application/json" },
  });
}

afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
  sessionStorage.clear();
});

describe("AppRouter", () => {
  it("sends a login code and shows the latest mock OTP", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async (input: RequestInfo) => {
        const url = requestUrl(input);
        if (url.includes("/auth/otp/send")) return json({ mode: "otp" });
        if (url.includes("/sms-mock/messages")) {
          return json([
            { phone: "+919876543210", code: "111111" },
            { phone: "+919876543210", code: "654321" },
          ]);
        }
        return json({ detail: "Not found" }, 404);
      }),
    );

    renderAt("/");
    expect(screen.queryByRole("button", { name: "I already have an account · Log in" })).toBeNull();
    fireEvent.click(screen.getByRole("button", { name: "Get started" }));
    expect(screen.queryByRole("radiogroup", { name: "Account" })).toBeNull();
    expect(screen.queryByText(/Business name/)).toBeNull();
    fireEvent.change(screen.getByPlaceholderText("98860 12345"), {
      target: { value: "9876543210" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Continue" }));

    expect(await screen.findByText("654321")).toBeTruthy();
    expect(screen.getByRole("button", { name: "Auto-fill" })).toBeTruthy();
  });

  it("stays on the OTP step when the code is rejected", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async (input: RequestInfo) => {
        const url = requestUrl(input);
        if (url.includes("/auth/otp/send")) return json({ mode: "otp" });
        if (url.includes("/sms-mock/messages")) return json([]);
        if (url.includes("/auth/otp/verify")) {
          const body = typeof input === "string" ? "" : await input.text();
          expect(body).toContain("000000");
          return json({ title: "Unauthorized", detail: "Code was not accepted" }, 401);
        }
        return json({ detail: "Not found" }, 404);
      }),
    );

    renderAt("/");
    fireEvent.click(screen.getByRole("button", { name: "Get started" }));
    fireEvent.change(screen.getByPlaceholderText("98860 12345"), {
      target: { value: "9876543210" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Continue" }));
    expect(await screen.findByRole("button", { name: "Verify & log in" })).toBeTruthy();
    fireEvent.change(screen.getByPlaceholderText("••••••"), { target: { value: "000000" } });
    fireEvent.click(screen.getByRole("button", { name: "Verify & log in" }));
    expect(await screen.findByText("Code was not accepted")).toBeTruthy();
  });

  it("shows the PIN step when the API asks for a PIN", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async (input: RequestInfo) => {
        const url = requestUrl(input);
        if (url.includes("/auth/otp/send")) return json({ mode: "pin" });
        return json({ detail: "Not found" }, 404);
      }),
    );

    renderAt("/");
    fireEvent.click(screen.getByRole("button", { name: "Get started" }));
    fireEvent.change(screen.getByPlaceholderText("98860 12345"), {
      target: { value: "9876543210" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Continue" }));
    expect(await screen.findByText("4-digit PIN")).toBeTruthy();
  });

  it("redirects a signed-out visit to the login screen", () => {
    renderAt("/dashboard");
    expect(screen.getByRole("button", { name: "Get started" })).toBeTruthy();
  });

  it("opens an empty page after a verified login", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async (input: RequestInfo) => {
        const url = requestUrl(input);
        if (url.includes("/auth/otp/send")) return json({ mode: "otp" });
        if (url.includes("/sms-mock/messages"))
          return json([{ phone: "+919876543210", code: "654321" }]);
        if (url.includes("/auth/otp/verify")) {
          const body = typeof input === "string" ? "" : await input.text();
          expect(JSON.parse(body).accountType).toBe("platform");
          return json(session);
        }
        if (url.includes("/auth/sign-out")) return new Response(null, { status: 204 });
        return json({ detail: "Not found" }, 404);
      }),
    );

    renderAt("/");
    fireEvent.click(screen.getByRole("button", { name: "Get started" }));
    fireEvent.change(screen.getByPlaceholderText("98860 12345"), {
      target: { value: "9876543210" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Continue" }));
    fireEvent.click(await screen.findByRole("button", { name: "Auto-fill" }));
    fireEvent.click(screen.getByRole("button", { name: "Verify & log in" }));
    expect(await screen.findByText("This page is not built yet.")).toBeTruthy();
    expect(screen.getByRole("button", { name: "Reviews" })).toBeTruthy();
    expect(screen.getByRole("button", { name: "Pharmacies" })).toBeTruthy();
    expect(screen.getByText("Ada")).toBeTruthy();
    expect(screen.getByText("Platform admin")).toBeTruthy();
    expect(screen.getByText("Namma")).toBeTruthy();
    fireEvent.click(screen.getByRole("button", { name: "Log out" }));
    expect(await screen.findByRole("button", { name: "Get started" })).toBeTruthy();
  });

  it("signs compliance staff in and shows Reviews", async () => {
    const compliance: Session = {
      ...session,
      account: account({ accountType: "staff", subtypes: ["compliance"], displayName: "Nia" }),
    };
    vi.stubGlobal(
      "fetch",
      vi.fn(async (input: RequestInfo) => {
        const url = requestUrl(input);
        if (url.includes("/auth/otp/send")) {
          const body = typeof input === "string" ? "" : await input.text();
          expect(JSON.parse(body).accountType).toBe("platform");
          return json({ mode: "otp" });
        }
        if (url.includes("/sms-mock/messages"))
          return json([{ phone: "+919876543210", code: "654321" }]);
        if (url.includes("/auth/otp/verify")) {
          const body = typeof input === "string" ? "" : await input.text();
          expect(JSON.parse(body).accountType).toBe("platform");
          return json(compliance);
        }
        return json({ detail: "Not found" }, 404);
      }),
    );

    renderAt("/");
    fireEvent.click(screen.getByRole("button", { name: "Get started" }));
    fireEvent.change(screen.getByPlaceholderText("98860 12345"), {
      target: { value: "9876543210" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Continue" }));
    fireEvent.click(await screen.findByRole("button", { name: "Auto-fill" }));
    fireEvent.click(screen.getByRole("button", { name: "Verify & log in" }));
    expect(await screen.findByRole("button", { name: "Reviews" })).toBeTruthy();
    expect(screen.getByRole("button", { name: "Pharmacies" })).toBeTruthy();
    expect(screen.getByText("Compliance")).toBeTruthy();
  });

  it("shows the role when the account has no name", async () => {
    const nameless: Session = {
      ...session,
      account: account({ displayName: null }),
    };
    vi.stubGlobal(
      "fetch",
      vi.fn(async (input: RequestInfo) => {
        const url = requestUrl(input);
        if (url.includes("/auth/otp/send")) return json({ mode: "otp" });
        if (url.includes("/sms-mock/messages"))
          return json([{ phone: "+919876543210", code: "654321" }]);
        if (url.includes("/auth/otp/verify")) return json(nameless);
        return json({ detail: "Not found" }, 404);
      }),
    );

    renderAt("/");
    fireEvent.click(screen.getByRole("button", { name: "Get started" }));
    fireEvent.change(screen.getByPlaceholderText("98860 12345"), {
      target: { value: "9876543210" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Continue" }));
    fireEvent.click(await screen.findByRole("button", { name: "Auto-fill" }));
    fireEvent.click(screen.getByRole("button", { name: "Verify & log in" }));
    expect(await screen.findByText("Platform admin")).toBeTruthy();
    expect(screen.queryByText("Pharmacist")).toBeNull();
    expect(screen.getByText("Namma")).toBeTruthy();
  });

  it("signs finance in and hides Reviews", async () => {
    const finance: Session = {
      ...session,
      account: account({ accountType: "staff", subtypes: ["finance"], displayName: "Faye" }),
    };
    vi.stubGlobal(
      "fetch",
      vi.fn(async (input: RequestInfo) => {
        const url = requestUrl(input);
        if (url.includes("/auth/otp/send")) return json({ mode: "otp" });
        if (url.includes("/sms-mock/messages"))
          return json([{ phone: "+919876543210", code: "654321" }]);
        if (url.includes("/auth/otp/verify")) return json(finance);
        return json({ detail: "Not found" }, 404);
      }),
    );

    renderAt("/");
    fireEvent.click(screen.getByRole("button", { name: "Get started" }));
    fireEvent.change(screen.getByPlaceholderText("98860 12345"), {
      target: { value: "9876543210" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Continue" }));
    fireEvent.click(await screen.findByRole("button", { name: "Auto-fill" }));
    fireEvent.click(screen.getByRole("button", { name: "Verify & log in" }));
    expect(await screen.findByRole("button", { name: "Pharmacies" })).toBeTruthy();
    expect(screen.queryByRole("button", { name: "Reviews" })).toBeNull();
    expect(screen.getByText("Finance")).toBeTruthy();
  });

  it("keeps Reviews when finance staff also hold compliance", async () => {
    const both: Session = {
      ...session,
      account: account({ accountType: "staff", subtypes: ["finance", "compliance"] }),
    };
    vi.stubGlobal(
      "fetch",
      vi.fn(async (input: RequestInfo) => {
        const url = requestUrl(input);
        if (url.includes("/auth/otp/send")) return json({ mode: "otp" });
        if (url.includes("/sms-mock/messages"))
          return json([{ phone: "+919876543210", code: "654321" }]);
        if (url.includes("/auth/otp/verify")) return json(both);
        return json({ detail: "Not found" }, 404);
      }),
    );

    renderAt("/");
    fireEvent.click(screen.getByRole("button", { name: "Get started" }));
    fireEvent.change(screen.getByPlaceholderText("98860 12345"), {
      target: { value: "9876543210" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Continue" }));
    fireEvent.click(await screen.findByRole("button", { name: "Auto-fill" }));
    fireEvent.click(screen.getByRole("button", { name: "Verify & log in" }));
    expect(await screen.findByRole("button", { name: "Reviews" })).toBeTruthy();
    expect(screen.getByRole("button", { name: "Pharmacies" })).toBeTruthy();
    expect(screen.getByText("Compliance, Finance")).toBeTruthy();
  });

  it("sends a finance session from Reviews back to Home", async () => {
    const finance: Session = {
      ...session,
      account: account({ accountType: "staff", subtypes: ["finance"] }),
    };
    sessionStorage.setItem(
      SESSION_STORAGE_KEY,
      JSON.stringify({ session: finance, pinReset: false, portalChoice: "finance" }),
    );
    renderAt("/reviews");
    expect(await screen.findByText("This page is not built yet.")).toBeTruthy();
    expect(screen.queryByRole("button", { name: "Reviews" })).toBeNull();
    expect(screen.getByRole("button", { name: "Pharmacies" })).toBeTruthy();
  });

  it("sends finance staff away from Support", async () => {
    const finance: Session = {
      ...session,
      account: account({ accountType: "staff", subtypes: ["finance"] }),
    };
    sessionStorage.setItem(
      SESSION_STORAGE_KEY,
      JSON.stringify({ session: finance, pinReset: false, portalChoice: "finance" }),
    );
    renderAt("/support");
    expect(await screen.findByText("This page is not built yet.")).toBeTruthy();
    expect(screen.queryByRole("button", { name: "Support" })).toBeNull();
  });

  it("shows Support to support staff", async () => {
    const support: Session = {
      ...session,
      account: account({ accountType: "staff", subtypes: ["support"], displayName: "Nia" }),
    };
    sessionStorage.setItem(
      SESSION_STORAGE_KEY,
      JSON.stringify({ session: support, pinReset: false, portalChoice: "support" }),
    );
    vi.stubGlobal("WebSocket", class {
      onclose: (() => void) | null = null;
      constructor() {}
      send() {}
      close() {
        this.onclose?.();
      }
    });
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => json([])),
    );
    renderAt("/support");
    expect(await screen.findByRole("button", { name: "Support" })).toBeTruthy();
    expect(await screen.findByRole("heading", { name: "FAQs" })).toBeTruthy();
  });

  it("clears a stored pharmacy session", async () => {
    const pharmacy: Session = {
      ...session,
      account: account({ accountType: "pharmacy", subtypes: [] }),
    };
    sessionStorage.setItem(
      SESSION_STORAGE_KEY,
      JSON.stringify({ session: pharmacy, pinReset: false }),
    );
    const fetchMock = vi.fn(async (input: RequestInfo) => {
      const url = requestUrl(input);
      if (url.includes("/auth/sign-out")) return new Response(null, { status: 204 });
      return json({ detail: "Not found" }, 404);
    });
    vi.stubGlobal("fetch", fetchMock);

    renderAt("/dashboard");
    expect(await screen.findByRole("button", { name: "Get started" })).toBeTruthy();
    await waitFor(() => {
      expect(
        fetchMock.mock.calls.some((call) =>
          requestUrl(call[0] as RequestInfo).includes("/auth/sign-out"),
        ),
      ).toBe(true);
    });
  });
});
