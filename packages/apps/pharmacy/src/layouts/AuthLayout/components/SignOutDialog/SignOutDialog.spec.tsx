import { render, screen, within } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { SaveConfirm, SignOutDialog } from "./SignOutDialog";

describe("SignOutDialog", () => {
  it("asks before logging out", () => {
    render(<SignOutDialog onCancel={cancel} onConfirm={confirm} />);
    expect(screen.getByRole("dialog", { name: "Log out" })).toBeTruthy();
    expect(screen.getByRole("button", { name: "Log out" })).toBeTruthy();
  });

  it("asks before saving", () => {
    render(
      <SaveConfirm
        title="Save this bill?"
        body="Nothing stored will be deleted."
        onCancel={cancel}
        onConfirm={confirm}
      />,
    );
    expect(screen.getByRole("dialog", { name: "Save this bill?" })).toBeTruthy();
    expect(screen.getByRole("button", { name: "Save" })).toBeTruthy();
  });

  it("uses the action label and color", () => {
    const view = render(
      <SaveConfirm
        title="Cancel this order?"
        body="The order is marked cancelled."
        tone="danger"
        confirm="Cancel order"
        onCancel={cancel}
        onConfirm={confirm}
      />,
    );
    const dialog = within(view.container);
    expect(dialog.getByRole("dialog").getAttribute("data-tone")).toBe("danger");
    expect(dialog.getByRole("button", { name: "Cancel order" })).toBeTruthy();
  });
});

function cancel() {}
function confirm() {}
