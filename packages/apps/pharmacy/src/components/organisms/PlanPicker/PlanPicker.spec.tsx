import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { PlanPicker } from "./PlanPicker";

describe("PlanPicker", () => {
  it("marks Essential as the current free plan", () => {
    function onRequest() {
      return undefined;
    }
    render(
      <PlanPicker
        cycle="monthly"
        currentPlan="Essential"
        currentCycle="monthly"
        onRequest={onRequest}
      />,
    );
    expect(screen.getByText("Growth")).toBeTruthy();
    expect(screen.getByRole("button", { name: "Current plan" })).toBeTruthy();
    expect(screen.getByText("Popular")).toBeTruthy();
  });
});
