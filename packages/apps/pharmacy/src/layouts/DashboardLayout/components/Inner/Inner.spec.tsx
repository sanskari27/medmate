import { render, screen } from "@testing-library/react";
import { Provider } from "react-redux";
import { describe, expect, it } from "vitest";
import { SaveConfirmContext } from "@/app/providers/PharmaProvider/saveConfirm";
import { store } from "@/store";
import { loadSession } from "@/store/thunks/auth.thunk";
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
  it("shows pharmacy sign in when there is no session", () => {
    store.dispatch(loadSession.rejected(null, "inner-spec", undefined, "UNAUTHORIZED"));
    renderInner();
    expect(screen.getByRole("button", { name: "Get started" })).toBeTruthy();
    expect(screen.queryByRole("button", { name: "Namma MedMate staff sign in" })).toBeNull();
  });
});
