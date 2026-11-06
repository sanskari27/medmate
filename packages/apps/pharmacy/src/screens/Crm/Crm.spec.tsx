import { render, screen } from "@testing-library/react";
import { Provider } from "react-redux";
import { describe, expect, it } from "vitest";
import { SaveConfirmContext } from "@/app/providers/PharmaProvider/saveConfirm";
import { store } from "@/store";
import CrmScreen from "./Crm";

function renderCrm() {
  return render(
    <Provider store={store}>
      <SaveConfirmContext.Provider value={{ ask: () => Promise.resolve(true) }}>
        <CrmScreen />
      </SaveConfirmContext.Provider>
    </Provider>,
  );
}

describe("Crm", () => {
  it("renders the overview", () => {
    renderCrm();
    expect(screen.getByRole("button", { name: "Overview" })).toBeTruthy();
    expect(screen.getByText("No at-risk patients — great retention!")).toBeTruthy();
  });
});
