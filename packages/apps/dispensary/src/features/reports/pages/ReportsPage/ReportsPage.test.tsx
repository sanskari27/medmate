import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
import { LATER_NOTE } from "../../catalog";
import { ReportsPage } from "./ReportsPage";

function renderPage() {
  return render(<ReportsPage />);
}

afterEach(() => {
  cleanup();
});

describe("ReportsPage", () => {
  it("searches names and descriptions and shows an empty column", () => {
    renderPage();
    fireEvent.change(screen.getByLabelText("Find report"), { target: { value: "daybook" } });
    expect(screen.getByRole("button", { name: "Daybook" })).toBeTruthy();
    expect(screen.queryByRole("button", { name: "GSTR-1 (Sales)" })).toBeNull();
    expect(screen.getAllByText("No matches").length).toBeGreaterThan(0);

    fireEvent.change(screen.getByLabelText("Find report"), { target: { value: "slab-wise" } });
    expect(screen.getByRole("button", { name: "GSTR-1 (Sales)" })).toBeTruthy();
    expect(screen.getByRole("button", { name: "GSTR-2 (Purchase)" })).toBeTruthy();
    expect(screen.queryByRole("button", { name: "Daybook" })).toBeNull();

    fireEvent.change(screen.getByLabelText("Find report"), { target: { value: "zzzz" } });
    expect(screen.getAllByText("No matches")).toHaveLength(5);
    expect(screen.queryByRole("button", { name: "Daybook" })).toBeNull();
  });

  it("shows the later-update note under the clicked card and clears it when the card hides", () => {
    renderPage();
    fireEvent.click(screen.getByRole("button", { name: "GSTR-1 (Sales)" }));
    let note = screen.getByText(LATER_NOTE);
    expect(note.previousElementSibling?.textContent).toContain("GSTR-1 (Sales)");

    fireEvent.click(screen.getByRole("button", { name: "Daybook" }));
    note = screen.getByText(LATER_NOTE);
    expect(screen.getAllByText(LATER_NOTE)).toHaveLength(1);
    expect(note.previousElementSibling?.textContent).toContain("Daybook");

    fireEvent.change(screen.getByLabelText("Find report"), { target: { value: "balance" } });
    expect(screen.queryByText(LATER_NOTE)).toBeNull();
    fireEvent.change(screen.getByLabelText("Find report"), { target: { value: "" } });
    expect(screen.queryByText(LATER_NOTE)).toBeNull();

    fireEvent.click(screen.getByRole("button", { name: "Daybook" }));
    expect(screen.getByText(LATER_NOTE)).toBeTruthy();
    fireEvent.click(screen.getByRole("button", { name: "Party" }));
    expect(screen.queryByText(LATER_NOTE)).toBeNull();
    expect(screen.queryByRole("button", { name: "Daybook" })).toBeNull();
    expect(screen.getByRole("button", { name: "Party Statement (Ledger)" })).toBeTruthy();
  });
});
