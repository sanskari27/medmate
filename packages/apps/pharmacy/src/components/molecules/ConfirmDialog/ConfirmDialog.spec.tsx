import { render, screen, within } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { ConfirmDialog } from "./ConfirmDialog";

describe("ConfirmDialog", () => {
  it("renders the question", () => {
    render(<ConfirmDialog title="Sign out" body="Leave this counter?" onClose={closeDialog} />);
    expect(screen.getByText("Leave this counter?")).toBeTruthy();
    expect(screen.getByRole("dialog").getAttribute("data-tone")).toBe("danger");
  });

  it("colors the dialog for the kind of action", () => {
    const view = render(
      <ConfirmDialog
        title="Create this invoice?"
        body="The bill is saved."
        tone="positive"
        onClose={closeDialog}
      />,
    );
    expect(within(view.container).getByRole("dialog").getAttribute("data-tone")).toBe("positive");
    view.rerender(
      <ConfirmDialog
        title="Cancel this order?"
        body="The order is marked cancelled."
        tone="danger"
        onClose={closeDialog}
      />,
    );
    expect(within(view.container).getByRole("dialog").getAttribute("data-tone")).toBe("danger");
    view.rerender(
      <ConfirmDialog
        title="Update this doctor?"
        body="Bills will show the new details."
        tone="caution"
        onClose={closeDialog}
      />,
    );
    expect(within(view.container).getByRole("dialog").getAttribute("data-tone")).toBe("caution");
    view.rerender(
      <ConfirmDialog
        title="Share these reports?"
        body="They are sent to the advisor."
        tone="info"
        onClose={closeDialog}
      />,
    );
    expect(within(view.container).getByRole("dialog").getAttribute("data-tone")).toBe("info");
  });
});

function closeDialog() {}
