import { render, screen } from "@testing-library/react";
import { Provider } from "react-redux";
import { describe, expect, it } from "vitest";
import { showToast } from "@/store/actions/feedback.actions";
import { store } from "@/store";
import { Toast } from "./Toast";

describe("Toast", () => {
  it("shows the pharmacy toast message", () => {
    store.dispatch(showToast("Bill saved"));
    render(
      <Provider store={store}>
        <Toast />
      </Provider>,
    );
    expect(screen.getByRole("status").textContent).toContain("Bill saved");
  });
});
