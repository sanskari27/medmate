import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { Alert } from "./Alert";

describe("Alert", () => {
  it("renders the message", () => {
    render(<Alert>GSTIN is missing</Alert>);
    expect(screen.getByText("GSTIN is missing")).toBeTruthy();
  });
});
