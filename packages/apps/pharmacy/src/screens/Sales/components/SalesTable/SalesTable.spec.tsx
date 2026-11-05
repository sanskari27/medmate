import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { SalesTable } from "./SalesTable";

describe("SalesTable", () => {
  it("renders the empty period message", () => {
    render(
      <SalesTable
        rows={[]}
        sort="date"
        direction="desc"
        now={0}
        tax="₹0"
        net="₹0"
        units={0}
        onSort={ignore}
        onOpen={ignore}
        onMarkPaid={ignore}
        onShare={ignore}
      />,
    );
    expect(screen.getByText("No sales in this period / filter.")).toBeTruthy();
  });
});

function ignore() {}
