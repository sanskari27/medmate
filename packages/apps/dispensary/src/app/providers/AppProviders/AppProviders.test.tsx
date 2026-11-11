import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { AppProviders } from "./AppProviders";

describe("AppProviders", () => {
  it("renders its children", () => {
    render(
      <AppProviders>
        <p>Ready</p>
      </AppProviders>,
    );
    expect(screen.getByText("Ready")).toBeTruthy();
  });
});
