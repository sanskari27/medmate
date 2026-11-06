import { render, screen } from "@testing-library/react";
import { Provider } from "react-redux";
import { describe, expect, it } from "vitest";
import { SaveConfirmContext } from "@/app/providers/PharmaProvider/saveConfirm";
import { store } from "@/store";
import CustomersScreen from "./Customers";

function renderCustomers() {
  return render(
    <Provider store={store}>
      <SaveConfirmContext.Provider value={{ ask: () => Promise.resolve(true) }}>
        <CustomersScreen />
      </SaveConfirmContext.Provider>
    </Provider>,
  );
}

describe("Customers", () => {
  it("renders the customer directory", () => {
    renderCustomers();
    expect(screen.getByRole("button", { name: "Excel" })).toBeTruthy();
    expect(screen.getByText("No customers match.")).toBeTruthy();
  });
});
