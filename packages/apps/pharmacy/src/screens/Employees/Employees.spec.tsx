import { render, screen } from "@testing-library/react";
import { Provider } from "react-redux";
import { describe, expect, it } from "vitest";
import { SaveConfirmContext } from "@/app/providers/PharmaProvider/saveConfirm";
import { store } from "@/store";
import EmployeesScreen from "./Employees";

function renderEmployees() {
  return render(
    <Provider store={store}>
      <SaveConfirmContext.Provider value={{ ask: () => Promise.resolve(true) }}>
        <EmployeesScreen />
      </SaveConfirmContext.Provider>
    </Provider>,
  );
}

describe("Employees", () => {
  it("renders the team directory", () => {
    renderEmployees();
    expect(screen.getByRole("button", { name: "Add Employee" })).toBeTruthy();
    expect(
      screen.getByText("No employees match this filter. Add your first team member."),
    ).toBeTruthy();
  });
});
