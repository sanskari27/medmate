import { render, screen } from "@testing-library/react";
import { Provider } from "react-redux";
import { describe, expect, it } from "vitest";
import { pushRoute } from "@/store/actions/feedback.actions";
import { store } from "@/store";
import { Canvas } from "./Canvas";

describe("Canvas", () => {
  it("shows the paywall when the route is locked", () => {
    store.dispatch(pushRoute("reports"));
    render(
      <Provider store={store}>
        <Canvas />
      </Provider>,
    );
    expect(screen.getByRole("heading", { name: "Reports is a premium feature" })).toBeTruthy();
  });
});
