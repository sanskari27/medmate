import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { SourceCards } from "./SourceCards";

describe("SourceCards", () => {
  it("renders the source label", () => {
    render(
      <SourceCards
        cards={[{ key: "counter", label: "Pharmacy Counter", short: "Counter", count: 2, amount: 10 }]}
        selected="all"
        onSelect={ignore}
      />,
    );
    expect(screen.getByText("Pharmacy Counter")).toBeTruthy();
  });
});

function ignore() {}
