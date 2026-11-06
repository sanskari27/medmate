import { render, screen } from "@testing-library/react";
import { Provider } from "react-redux";
import { describe, expect, it } from "vitest";
import { SaveConfirmContext } from "@/app/providers/PharmaProvider/saveConfirm";
import { store } from "@/store";
import OrdersScreen from "./Orders";

function renderOrders() {
  return render(
    <Provider store={store}>
      <SaveConfirmContext.Provider value={{ ask: () => Promise.resolve(true) }}>
        <OrdersScreen />
      </SaveConfirmContext.Provider>
    </Provider>,
  );
}

describe("OrdersScreen", () => {
  it("renders the empty order list", () => {
    renderOrders();
    expect(screen.getByText("No orders in this view.")).toBeTruthy();
  });
});
