import { render, screen } from "@testing-library/react";
import { Provider } from "react-redux";
import { describe, expect, it } from "vitest";
import { resetRoute } from "@/store/actions/feedback.actions";
import type { SessionSnapshot } from "@/store/session";
import { loadSession } from "@/store/thunks/auth.thunk";
import { store } from "@/store";
import { AppSidebar } from "./AppSidebar";

describe("AppSidebar", () => {
  it("renders the store name and a nav destination", () => {
    store.dispatch(resetRoute("dashboard"));
    store.dispatch(
      loadSession.fulfilled(
        {
          businessType: "pharmacy",
          setupComplete: true,
          profile: {
            name: "Sri Sai Medicals",
            pharmacist: "Anita Rao, B.Pharm",
            storeOpen: true,
          },
          user: { id: "owner", role: "Owner", permissions: [] },
          subscription: { plan: "Essential" },
        } as unknown as SessionSnapshot,
        "sidebar-spec",
        undefined,
      ),
    );
    function onNavigate() {
      return undefined;
    }
    render(
      <Provider store={store}>
        <AppSidebar open onNavigate={onNavigate} />
      </Provider>,
    );
    expect(screen.getByText("Sri Sai Medicals")).toBeTruthy();
    expect(screen.getByRole("button", { name: "Dashboard" })).toBeTruthy();
  });
});
