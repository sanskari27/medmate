import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { OrderTimeline } from "./OrderTimeline";

describe("OrderTimeline", () => {
  it("renders the online steps", () => {
    render(<OrderTimeline status="accepted" />);
    expect(screen.getByText("Accepted")).toBeTruthy();
    expect(screen.getByText("Delivered")).toBeTruthy();
  });
});
