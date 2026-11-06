import { render, screen } from "@testing-library/react";
import { Provider } from "react-redux";
import { describe, expect, it } from "vitest";
import { SaveConfirmContext } from "@/app/providers/PharmaProvider/saveConfirm";
import { store } from "@/store";
import Billing from "./Billing";

function renderBilling() {
  return render(
    <Provider store={store}>
      <SaveConfirmContext.Provider value={{ ask: () => Promise.resolve(true) }}>
        <Billing />
      </SaveConfirmContext.Provider>
    </Provider>,
  );
}

describe("Billing", () => {
  it("renders the cart step", () => {
    renderBilling();
    expect(screen.getByText(/Cart & customer/)).toBeTruthy();
    expect(screen.getByText("Scan or tap a medicine to start billing.")).toBeTruthy();
  });
});
