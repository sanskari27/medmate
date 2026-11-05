import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { TableCell, TableHeaderCell, TableRow } from "@/components/atoms";
import { DataTable } from "./DataTable";

describe("DataTable", () => {
  it("renders rows and an empty title", () => {
    const view = render(
      <DataTable
        head={
          <TableRow>
            <TableHeaderCell>Name</TableHeaderCell>
          </TableRow>
        }
      >
        <TableRow>
          <TableCell>Crocin</TableCell>
        </TableRow>
      </DataTable>,
    );
    expect(screen.getByText("Crocin")).toBeTruthy();
    view.rerender(<DataTable isEmpty emptyTitle="No rows" emptyBody="Nothing to show." />);
    expect(screen.getByText("No rows")).toBeTruthy();
  });
});
