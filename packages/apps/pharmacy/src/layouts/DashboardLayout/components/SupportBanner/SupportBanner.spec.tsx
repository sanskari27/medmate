import { render, screen } from "@testing-library/react";
import { Provider } from "react-redux";
import { describe, expect, it } from "vitest";
import type { SessionSnapshot } from "@/store/session";
import { loadSession } from "@/store/thunks/auth.thunk";
import { store } from "@/store";
import { SupportBanner } from "./SupportBanner";

describe("SupportBanner", () => {
  it("shows the support session", () => {
    store.dispatch(
      loadSession.fulfilled(
        {
          impersonator: "ops@medmate",
          businessType: "pharmacy",
          setupComplete: false,
          profile: { name: "Sri Sai Medicals" },
        } as unknown as SessionSnapshot,
        "support-banner",
        undefined,
      ),
    );
    render(
      <Provider store={store}>
        <SupportBanner />
      </Provider>,
    );
    expect(screen.getByRole("status").textContent).toContain(
      "Support · Sri Sai Medicals · ops@medmate",
    );
  });
});
