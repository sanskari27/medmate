import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { ListRow } from "./ListRow";

describe("ListRow", () => {
  it("renders the title", () => {
    render(<ListRow title="Paracetamol" subtitle="500 mg" />);
    expect(screen.getByText("Paracetamol")).toBeTruthy();
  });
});
