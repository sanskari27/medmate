import { render, screen } from "@testing-library/react";
import { Provider } from "react-redux";
import { describe, expect, it } from "vitest";
import { SaveConfirmContext } from "@/app/providers/PharmaProvider/saveConfirm";
import { store } from "@/store";
import SalesScreen from "./Sales";

function renderSales() {
  return render(
    <Provider store={store}>
      <SaveConfirmContext.Provider value={{ ask: () => Promise.resolve(true) }}>
        <SalesScreen />
      </SaveConfirmContext.Provider>
    </Provider>,
  );
}

describe("SalesScreen", () => {
  it("renders the sales heading", () => {
    renderSales();
    expect(screen.getByText("All sales")).toBeTruthy();
    expect(screen.getByText("No sales in this period / filter.")).toBeTruthy();
  });
});
