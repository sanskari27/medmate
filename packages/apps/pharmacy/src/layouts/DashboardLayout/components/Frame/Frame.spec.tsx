import { render, screen } from "@testing-library/react";
import { Provider } from "react-redux";
import { describe, expect, it } from "vitest";
import { SaveConfirmContext } from "@/app/providers/PharmaProvider/saveConfirm";
import { clearFormFault } from "@/store/actions/feedback.actions";
import { store } from "@/store";
import { loadSession } from "@/store/thunks/auth.thunk";
import { Frame } from "./Frame";

function renderFrame() {
  store.dispatch(loadSession.rejected(null, "frame-spec", undefined, "UNAUTHORIZED"));
  store.dispatch(clearFormFault());
  return render(
    <Provider store={store}>
      <SaveConfirmContext.Provider value={{ ask: () => Promise.resolve(true) }}>
        <Frame />
      </SaveConfirmContext.Provider>
    </Provider>,
  );
}

describe("Frame", () => {
  it("keeps the fault hook and shows pharmacy sign in", () => {
    renderFrame();
    expect(document.querySelector("[data-slot='app-frame']")?.getAttribute("data-fault")).toBe("");
    expect(screen.getByRole("button", { name: "Get started" })).toBeTruthy();
  });
});
