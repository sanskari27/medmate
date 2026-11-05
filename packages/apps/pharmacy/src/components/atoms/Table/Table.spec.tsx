import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { Table } from "./Table";

describe("Table", () => {
  it("renders a table", () => {
    render(<Table>Cell</Table>);
    expect(screen.getByText("Cell").tagName).toBe("TABLE");
  });
});
