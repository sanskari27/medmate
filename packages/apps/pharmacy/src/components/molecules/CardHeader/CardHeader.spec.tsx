import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { Text } from "@/components/atoms";
import { CardHeader } from "./CardHeader";

describe("CardHeader", () => {
  it("renders the title and subtitle", () => {
    render(<CardHeader title="Stock" subtitle="Today" />);
    expect(screen.getByRole("heading", { name: "Stock" })).toBeTruthy();
    expect(screen.getByText("Today")).toBeTruthy();
  });

  it("renders header actions", () => {
    render(<CardHeader title="Bills" actions={<Text>Export</Text>} />);
    expect(screen.getByRole("heading", { name: "Bills" })).toBeTruthy();
    expect(screen.getByText("Export")).toBeTruthy();
  });
});
