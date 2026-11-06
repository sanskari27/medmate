import { render, screen } from "@testing-library/react";
import { Provider } from "react-redux";
import { describe, expect, it, vi } from "vitest";
import { SaveConfirmContext } from "@/app/providers/PharmaProvider/saveConfirm";
import { clearFormFault } from "@/store/actions/feedback.actions";
import { store } from "@/store";
import { Frame } from "./Frame";

vi.mock("@/services/api/apiClient", () => ({
  api: function api() {
    return new Promise(function wait() {});
  },
}));

function renderFrame() {
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
  it("keeps the fault hook and shows the boot state", () => {
    renderFrame();
    expect(document.querySelector("[data-slot='app-frame']")?.getAttribute("data-fault")).toBe("");
    expect(screen.getByText("Loading pharmacy…")).toBeTruthy();
  });
});
