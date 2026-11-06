import { render, screen } from "@testing-library/react";
import { Provider } from "react-redux";
import { describe, expect, it } from "vitest";
import { setFormFault } from "@/store/actions/feedback.actions";
import { store } from "@/store";
import { FaultBanner } from "./FaultBanner";

describe("FaultBanner", () => {
  it("shows the form fault", () => {
    store.dispatch(setFormFault({ field: "gstin", message: "Enter a valid GSTIN" }));
    render(
      <Provider store={store}>
        <FaultBanner />
      </Provider>,
    );
    expect(screen.getByRole("alert").textContent).toContain("Enter a valid GSTIN");
  });
});
