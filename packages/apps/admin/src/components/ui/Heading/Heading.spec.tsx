import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { Heading } from "./Heading";

describe("Heading", () => {
  it("renders the requested level", () => {
    render(<Heading level={1}>Billing</Heading>);
    expect(screen.getByRole("heading", { level: 1, name: "Billing" })).toBeTruthy();
  });
});
