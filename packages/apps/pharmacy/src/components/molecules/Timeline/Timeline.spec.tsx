import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { Timeline } from "./Timeline";

describe("Timeline", () => {
  it("lists an event and marks a bad tone", () => {
    const { container } = render(
      <Timeline items={[{ label: "Rejected", time: "10:00", tone: "bad" }]} />,
    );
    expect(screen.getByText("Rejected")).toBeTruthy();
    expect(screen.getByText("10:00")).toBeTruthy();
    expect(container.querySelector(".bg-rose")).toBeTruthy();
  });
});
