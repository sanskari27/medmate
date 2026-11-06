import { render, screen } from "@testing-library/react";
import { Provider } from "react-redux";
import { describe, expect, it } from "vitest";
import { SaveConfirmContext } from "@/app/providers/PharmaProvider/saveConfirm";
import { store } from "@/store";
import InventoryScreen from "./Inventory";

function renderInventory() {
  return render(
    <Provider store={store}>
      <SaveConfirmContext.Provider value={{ ask: () => Promise.resolve(true) }}>
        <InventoryScreen />
      </SaveConfirmContext.Provider>
    </Provider>,
  );
}

describe("InventoryScreen", () => {
  it("renders the empty catalogue", () => {
    renderInventory();
    expect(screen.getByText("Total SKUs")).toBeTruthy();
    expect(
      screen.getByText("No products yet — add stock by entering a distributor purchase bill."),
    ).toBeTruthy();
  });
});
