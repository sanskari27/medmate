import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { ConfirmDialog } from "./ConfirmDialog";

describe("ConfirmDialog", () => {
  it("renders the question", () => {
    render(<ConfirmDialog title="Sign out" body="Leave this counter?" onClose={closeDialog} />);
    expect(screen.getByText("Leave this counter?")).toBeTruthy();
  });
});

function closeDialog() {}
