import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { OrderFilters } from "./OrderFilters";

describe("OrderFilters", () => {
  it("renders the order views", () => {
    render(
      <OrderFilters
        filter="all"
        counts={{ all: 1, online: 1, offline: 0, action: 1, unpaid: 0 }}
        searchQuery=""
        onFilter={ignore}
        onSearch={ignore}
      />,
    );
    expect(screen.getByRole("button", { name: "All (1)" })).toBeTruthy();
    expect(screen.getByPlaceholderText("Search invoice, customer, phone…")).toBeTruthy();
  });
});

function ignore() {}
