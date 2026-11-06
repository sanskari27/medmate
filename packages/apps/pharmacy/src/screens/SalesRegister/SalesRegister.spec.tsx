import { render, screen } from "@testing-library/react";
import { Provider } from "react-redux";
import { describe, expect, it } from "vitest";
import { SaveConfirmContext } from "@/app/providers/PharmaProvider/saveConfirm";
import { store } from "@/store";
import SalesRegisterScreen from "./SalesRegister";

function renderSalesRegister() {
  return render(
    <Provider store={store}>
      <SaveConfirmContext.Provider value={{ ask: () => Promise.resolve(true) }}>
        <SalesRegisterScreen />
      </SaveConfirmContext.Provider>
    </Provider>,
  );
}

describe("SalesRegisterScreen", () => {
  it("renders the source chips and empty table", () => {
    renderSalesRegister();
    expect(screen.getByRole("button", { name: "All sources" })).toBeTruthy();
    expect(screen.getByText("No sales match these filters.")).toBeTruthy();
  });
});
