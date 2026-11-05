import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { SearchField } from "./SearchField";

describe("SearchField", () => {
  it("exposes a search box", () => {
    render(<SearchField label="Find medicine" />);
    expect(screen.getByRole("searchbox", { name: "Find medicine" })).toBeTruthy();
  });
});
