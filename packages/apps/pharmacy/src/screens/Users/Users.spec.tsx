import { render, screen } from "@testing-library/react";
import { Provider } from "react-redux";
import { describe, expect, it } from "vitest";
import { SaveConfirmContext } from "@/app/providers/PharmaProvider/saveConfirm";
import { store } from "@/store";
import UsersScreen from "./Users";

function renderUsers() {
  return render(
    <Provider store={store}>
      <SaveConfirmContext.Provider value={{ ask: () => Promise.resolve(true) }}>
        <UsersScreen />
      </SaveConfirmContext.Provider>
    </Provider>,
  );
}

describe("Users", () => {
  it("renders staff access controls", () => {
    renderUsers();
    expect(screen.getByRole("button", { name: "Add user" })).toBeTruthy();
    expect(screen.getByText("Staff & access control")).toBeTruthy();
  });
});
