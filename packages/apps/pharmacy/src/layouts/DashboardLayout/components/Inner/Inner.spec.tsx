import { render, screen } from "@testing-library/react";
import { Provider } from "react-redux";
import { describe, expect, it } from "vitest";
import { SaveConfirmContext } from "@/app/providers/PharmaProvider/saveConfirm";
import { store } from "@/store";
import { Inner } from "./Inner";

function renderInner() {
  return render(
    <Provider store={store}>
      <SaveConfirmContext.Provider value={{ ask: () => Promise.resolve(true) }}>
        <Inner />
      </SaveConfirmContext.Provider>
    </Provider>,
  );
}

describe("Inner", () => {
  it("waits for the master session before showing sign in", () => {
    renderInner();
    expect(screen.getByText("Loading pharmacy…")).toBeTruthy();
  });
});
