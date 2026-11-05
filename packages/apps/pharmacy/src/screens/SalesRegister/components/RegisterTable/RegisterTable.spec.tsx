import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { RegisterTable } from "./RegisterTable";

describe("RegisterTable", () => {
  it("renders the empty filter message", () => {
    render(<RegisterTable rows={[]} revenue="₹0" />);
    expect(screen.getByText("No sales match these filters.")).toBeTruthy();
  });
});
