import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { PageHeader } from "./PageHeader";

describe("PageHeader", () => {
  it("renders the screen title", () => {
    render(<PageHeader title="Inventory" subtitle="Batches and stock" />);
    expect(screen.getByRole("heading", { level: 1, name: "Inventory" })).toBeTruthy();
  });
});
