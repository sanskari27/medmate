import { render, screen } from "@testing-library/react";
import { Provider } from "react-redux";
import { describe, expect, it } from "vitest";
import { SaveConfirmContext } from "@/app/providers/PharmaProvider/saveConfirm";
import { store } from "@/store";
import PrescriptionsScreen from "./Prescriptions";

function renderPrescriptions() {
  return render(
    <Provider store={store}>
      <SaveConfirmContext.Provider value={{ ask: () => Promise.resolve(true) }}>
        <PrescriptionsScreen />
      </SaveConfirmContext.Provider>
    </Provider>,
  );
}

describe("Prescriptions", () => {
  it("renders the empty queue", () => {
    renderPrescriptions();
    expect(screen.getByText("Nothing here")).toBeTruthy();
    expect(screen.getByText("No prescriptions match this view.")).toBeTruthy();
  });
});
