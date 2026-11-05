import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { CopyButton } from "./CopyButton";

describe("CopyButton", () => {
  it("writes the given text to the clipboard", () => {
    const writeText = vi.fn().mockResolvedValue(undefined);
    Object.assign(navigator, { clipboard: { writeText } });
    render(<CopyButton text="priya.cashier" label="login ID" />);
    fireEvent.click(screen.getByRole("button", { name: "Copy login ID" }));
    expect(writeText).toHaveBeenCalledWith("priya.cashier");
  });
});
