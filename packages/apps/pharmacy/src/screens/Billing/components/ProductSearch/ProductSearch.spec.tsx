import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { ProductSearch } from "./ProductSearch";

describe("ProductSearch", () => {
  it("renders the scan and search fields", () => {
    render(
      <ProductSearch
        scan=""
        searchQuery=""
        onScanChange={ignore}
        onScanSubmit={ignore}
        onSearchChange={ignore}
      />,
    );
    expect(screen.getByPlaceholderText("Scan barcode / type batch no. + Enter")).toBeTruthy();
    expect(screen.getByPlaceholderText("Search medicine, salt, brand…")).toBeTruthy();
  });
});

function ignore() {}
