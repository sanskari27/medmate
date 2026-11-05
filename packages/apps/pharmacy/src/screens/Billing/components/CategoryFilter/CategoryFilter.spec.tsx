import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { CategoryFilter } from "./CategoryFilter";

describe("CategoryFilter", () => {
  it("renders All and the category labels", () => {
    render(
      <CategoryFilter
        categories={[{ key: "fever", label: "Fever" }]}
        selectedCategory="all"
        onSelect={ignore}
      />,
    );
    expect(screen.getByRole("button", { name: "All" })).toBeTruthy();
    expect(screen.getByRole("button", { name: "Fever" })).toBeTruthy();
  });
});

function ignore() {}
