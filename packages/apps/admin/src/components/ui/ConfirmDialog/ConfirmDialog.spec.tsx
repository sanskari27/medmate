import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { ConfirmDialog } from "./ConfirmDialog";

describe("ConfirmDialog", () => {
  it("shows the title, sentence, and confirm, and dismisses from cancel or the overlay", () => {
    const onClose = vi.fn();
    render(
      <ConfirmDialog title="Block this account?" body="The owner is restricted." onClose={onClose}>
        <button type="button" onClick={onClose}>
          Cancel
        </button>
        <button type="button">Block account</button>
      </ConfirmDialog>,
    );

    expect(screen.getByRole("dialog", { name: "Block this account?" })).toBeTruthy();
    expect(screen.getByText("The owner is restricted.")).toBeTruthy();
    expect(screen.getByRole("button", { name: "Block account" })).toBeTruthy();
    fireEvent.click(screen.getByRole("dialog"));
    expect(onClose).not.toHaveBeenCalled();
    fireEvent.click(screen.getByRole("button", { name: "Cancel" }));
    expect(onClose).toHaveBeenCalledTimes(1);
    fireEvent.click(document.querySelector("[data-slot=modal-overlay]") as Element);
    expect(onClose).toHaveBeenCalledTimes(2);
  });
});
