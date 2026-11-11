import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { Provider } from "react-redux";
import { MemoryRouter } from "react-router-dom";
import { afterEach, describe, expect, it, vi } from "vitest";
import { createAppStore } from "@/app/store";
import { writeSession } from "@/services/storage";
import type { Session } from "@/types";
import { AccountRestrictedPage } from "./SetupPages";

const session: Session = {
  accessToken: "access",
  refreshToken: "refresh",
  expiresIn: 900,
  account: {
    id: "account-id",
    accountType: "pharmacy",
    phone: "+919876543210",
    displayName: "Ada",
    pharmacyId: "pharmacy-id",
    pharmacyRole: "owner",
    verificationStatus: "approved",
    rejection: null,
    subtypes: [],
    permissions: [],
    pinSetupRequired: false,
    disabled: true,
  },
};

afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
  sessionStorage.clear();
});

describe("AccountRestricted", () => {
  it("shows the waiting copy, the support link, and log out", async () => {
    const calls: string[] = [];
    vi.stubGlobal(
      "fetch",
      vi.fn(async (input: RequestInfo) => {
        calls.push(
          typeof input === "string" ? input : input instanceof URL ? input.toString() : input.url,
        );
        return new Response(null, { status: 204 });
      }),
    );
    writeSession(session);
    render(
      <Provider store={createAppStore()}>
        <MemoryRouter>
          <AccountRestrictedPage />
        </MemoryRouter>
      </Provider>,
    );

    expect(screen.getByRole("heading", { name: "Your account is restricted." })).toBeTruthy();
    expect(screen.getByText("Contact us to get it unblocked.")).toBeTruthy();
    expect(screen.getByRole("link", { name: "Contact us" }).getAttribute("href")).toBe(
      "mailto:support@nammamedmate.com",
    );
    fireEvent.click(screen.getByRole("button", { name: "Log out" }));
    await vi.waitFor(() => expect(calls.some((url) => url.includes("/auth/sign-out"))).toBe(true));
  });
});
