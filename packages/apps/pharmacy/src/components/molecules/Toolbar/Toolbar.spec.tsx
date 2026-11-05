import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { Text } from "@/components/atoms";
import { Toolbar } from "./Toolbar";

describe("Toolbar", () => {
  it("renders its actions", () => {
    render(<Toolbar><Text>Filters</Text></Toolbar>);
    expect(screen.getByText("Filters")).toBeTruthy();
  });
});
