import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { KeyValue } from "./KeyValue";

describe("KeyValue", () => {
  it("renders the pair", () => {
    render(<KeyValue label="GSTIN" value="18AAAAA0000A1Z5" />);
    expect(screen.getByText("18AAAAA0000A1Z5")).toBeTruthy();
  });
});
