import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { InventoryToolbar } from "./InventoryToolbar";

describe("InventoryToolbar", () => {
  it("renders the catalogue filters", () => {
    render(
      <InventoryToolbar
        filter="all"
        alertCount={0}
        unallocatedCount={0}
        searchQuery=""
        canExport={false}
        onFilter={ignore}
        onSearch={ignore}
        onExcel={ignore}
        onPdf={ignore}
        onRackMap={ignore}
        onSample={ignore}
        onImportFile={ignore}
        onAddStock={ignore}
      />,
    );
    expect(screen.getByRole("button", { name: "All" })).toBeTruthy();
    expect(screen.getByRole("button", { name: "Add stock via purchase" })).toBeTruthy();
  });
});

function ignore() {}
