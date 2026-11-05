import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { OnboardingCarousel } from "./OnboardingCarousel";

describe("OnboardingCarousel", () => {
  it("shows the first intro slide", () => {
    function onMaster() {
      return undefined;
    }
    render(<OnboardingCarousel onMaster={onMaster} />);
    expect(screen.getByRole("heading", { name: "Billing, GST & inventory in one place" })).toBeTruthy();
    expect(screen.getByRole("button", { name: "Get started" })).toBeTruthy();
  });
});
