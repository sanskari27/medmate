import { render, screen } from "@testing-library/react";
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
  });
});

function cancel() {}
function confirm() {}
