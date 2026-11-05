import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { RegisterFilters } from "./RegisterFilters";

describe("RegisterFilters", () => {
  it("renders the patient search", () => {
    render(
      <RegisterFilters
        payMode="all"
        paid="all"
        insurer="all"
        ward="all"
        insurers={[]}
        wards={[]}
        searchQuery=""
        onPayMode={ignore}
        onPaid={ignore}
        onInsurer={ignore}
        onWard={ignore}
        onSearch={ignore}
      />,
    );
    expect(screen.getByPlaceholderText("Invoice, patient, phone…")).toBeTruthy();
  });
});

function ignore() {}
