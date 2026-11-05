import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { ProductGrid } from "./ProductGrid";

describe("ProductGrid", () => {
  it("shows the empty search message", () => {
    render(
      <ProductGrid
        products={[]}
        searchQuery="ibuprofen"
        packQty={zero}
        looseQty={zero}
        onAddPack={ignore}
        onAddLoose={ignore}
      />,
    );
    expect(screen.getByText("No medicines match “ibuprofen”.")).toBeTruthy();
  });
});

function zero() {
  return 0;
}
function ignore() {}
