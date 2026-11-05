import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { CopyField } from "./CopyField";

describe("CopyField", () => {
  it("shows the value and a copy action", () => {
    render(<CopyField label="Login ID" value="asha" />);
    expect(screen.getByText("asha")).toBeTruthy();
    expect(screen.getByRole("button", { name: "Copy Login ID" })).toBeTruthy();
  });
});
