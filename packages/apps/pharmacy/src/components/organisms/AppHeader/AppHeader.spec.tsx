import { render, screen } from "@testing-library/react";
import { Provider } from "react-redux";
import { describe, expect, it } from "vitest";
import { resetRoute } from "@/store/actions/feedback.actions";
import { store } from "@/store";
import { AppHeader } from "./AppHeader";

describe("AppHeader", () => {
  it("renders the page title and upgrade chip", () => {
    store.dispatch(resetRoute("dashboard"));
    function onMenu() {
      return undefined;
    }
    render(
      <Provider store={store}>
        <AppHeader onMenu={onMenu} />
      </Provider>,
    );
    expect(screen.getByRole("heading", { name: "Dashboard" })).toBeTruthy();
    expect(screen.getByRole("button", { name: "Essential · Upgrade" })).toBeTruthy();
  });
});
