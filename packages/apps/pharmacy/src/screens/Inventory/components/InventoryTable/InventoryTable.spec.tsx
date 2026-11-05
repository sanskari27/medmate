import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { InventoryTable } from "./InventoryTable";

describe("InventoryTable", () => {
  it("renders the empty catalogue message", () => {
    render(
      <InventoryTable
        products={[]}
        catalogueEmpty
        now={0}
        onOpen={ignore}
        onEdit={ignore}
        onToggleLoose={ignore}
        onToggleOnline={ignore}
        onGo={ignore}
      />,
    );
    expect(screen.getByText("No products yet — add stock by entering a distributor purchase bill.")).toBeTruthy();
  });
});

function ignore() {}
