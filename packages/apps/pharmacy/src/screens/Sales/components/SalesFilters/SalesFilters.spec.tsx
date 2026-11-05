import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { SalesFilters } from "./SalesFilters";

describe("SalesFilters", () => {
  it("renders the search field", () => {
    render(
      <SalesFilters
        searchQuery=""
        channel="all"
        payMode="all"
        status="all"
        paid="all"
        onSearch={ignore}
        onChannel={ignore}
        onPayMode={ignore}
        onStatus={ignore}
        onPaid={ignore}
      />,
    );
    expect(screen.getByPlaceholderText("Invoice, customer, phone…")).toBeTruthy();
  });
});

function ignore() {}
