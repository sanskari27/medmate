import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { StatusPill } from "./StatusPill";

describe("StatusPill", () => {
  it("labels a delivered order", () => {
    render(<StatusPill status="delivered" />);
    expect(screen.getByText("Delivered")).toBeTruthy();
  });
});
