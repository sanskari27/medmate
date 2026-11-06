import { render, screen } from "@testing-library/react";
import { Provider } from "react-redux";
import { describe, expect, it } from "vitest";
import { SaveConfirmContext } from "@/app/providers/PharmaProvider/saveConfirm";
import { store } from "@/store";
import { OnboardingCarousel } from "./OnboardingCarousel";

describe("OnboardingCarousel", () => {
  it("shows the first intro slide", () => {
    function onMaster() {
      return undefined;
    }
    render(
      <Provider store={store}>
        <SaveConfirmContext.Provider value={{ ask: () => Promise.resolve(true) }}>
          <OnboardingCarousel onMaster={onMaster} />
        </SaveConfirmContext.Provider>
      </Provider>,
    );
    expect(
      screen.getByRole("heading", { name: "Billing, GST & inventory in one place" }),
    ).toBeTruthy();
    expect(screen.getByRole("button", { name: "Get started" })).toBeTruthy();
  });
});
