import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { UpgradeChip } from "./UpgradeChip";

describe("UpgradeChip", () => {
  it("offers the essential upgrade", () => {
    render(<UpgradeChip />);
    expect(screen.getByRole("button", { name: /Upgrade/ })).toBeTruthy();
  });
});
