import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { ChoiceCard } from "./ChoiceCard";

describe("ChoiceCard", () => {
  it("shows the title and selling points", () => {
    render(
      <ChoiceCard
        selected
        title="Pharmacy"
        description="Retail counter"
        points={["GST billing"]}
      />,
    );
    expect(screen.getByRole("button", { name: /Pharmacy/ })).toBeTruthy();
    expect(screen.getByText("GST billing")).toBeTruthy();
    expect(screen.getByText("Retail counter")).toBeTruthy();
  });
});
