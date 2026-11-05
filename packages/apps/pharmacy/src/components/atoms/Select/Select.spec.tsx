import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { Select } from "./Select";

describe("Select", () => {
  it("renders a select", () => {
    render(<Select aria-label="Select" options={[{ value: "cash", label: "Cash" }]} />);
    expect(screen.getByLabelText("Select").tagName).toBe("SELECT");
    expect(screen.getByRole("option", { name: "Cash" }).getAttribute("value")).toBe("cash");
  });
});
