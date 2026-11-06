import { render, screen } from "@testing-library/react";
import { Provider } from "react-redux";
import { describe, expect, it } from "vitest";
import { SaveConfirmContext } from "@/app/providers/PharmaProvider/saveConfirm";
import { store } from "@/store";
import DoctorsScreen from "./Doctors";

function renderDoctors() {
  return render(
    <Provider store={store}>
      <SaveConfirmContext.Provider value={{ ask: () => Promise.resolve(true) }}>
        <DoctorsScreen />
      </SaveConfirmContext.Provider>
    </Provider>,
  );
}

describe("Doctors", () => {
  it("renders the directory actions", () => {
    renderDoctors();
    expect(screen.getByRole("button", { name: "Add Doctor" })).toBeTruthy();
    expect(screen.getByText("No doctors match. Add one with “Add Doctor”.")).toBeTruthy();
  });
});
