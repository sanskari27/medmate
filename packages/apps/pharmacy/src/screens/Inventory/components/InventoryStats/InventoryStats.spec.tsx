import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { InventoryStats } from "./InventoryStats";

describe("InventoryStats", () => {
  it("renders the SKU count", () => {
    render(
      <InventoryStats
        snapshot={{
          totalSkus: 4,
          totalUnits: 10,
          totalValue: 0,
          retailValue: 0,
          potentialMargin: 0,
          lowCount: 0,
          expiringCount: 0,
          expiringValue: 0,
          outCount: 0,
          alertCount: 0,
          unallocatedCount: 0,
          deadCount: 0,
          deadValue: 0,
        }}
        onFilter={ignore}
      />,
    );
    expect(screen.getByText("4")).toBeTruthy();
    expect(screen.getByText("Total SKUs")).toBeTruthy();
  });
});

function ignore() {}
