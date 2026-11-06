import { render, screen } from "@testing-library/react";
import { Provider } from "react-redux";
import { describe, expect, it } from "vitest";
import { SaveConfirmContext } from "@/app/providers/PharmaProvider/saveConfirm";
import { store } from "@/store";
import { SetupWizard } from "./SetupWizard";

function renderWizard() {
  return render(
    <Provider store={store}>
      <SaveConfirmContext.Provider value={{ ask: () => Promise.resolve(true) }}>
        <SetupWizard />
      </SaveConfirmContext.Provider>
    </Provider>,
  );
}

describe("SetupWizard", () => {
  it("opens on the welcome step", () => {
    renderWizard();
    expect(screen.getByRole("heading", { name: /^Welcome$/ })).toBeTruthy();
    expect(screen.getByRole("button", { name: "Get started" })).toBeTruthy();
  });
});
