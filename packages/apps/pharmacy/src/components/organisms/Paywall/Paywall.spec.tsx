import { render, screen } from "@testing-library/react";
import { Provider } from "react-redux";
import { describe, expect, it } from "vitest";
import { store } from "@/store";
import { Paywall } from "./Paywall";

describe("Paywall", () => {
  it("explains that the route is a premium feature", () => {
    render(
      <Provider store={store}>
        <Paywall route="crm" />
      </Provider>,
    );
    expect(
      screen.getByRole("heading", { name: "CRM · Patients is a premium feature" }),
    ).toBeTruthy();
    expect(screen.getByRole("button", { name: "Upgrade to unlock" })).toBeTruthy();
  });
});
