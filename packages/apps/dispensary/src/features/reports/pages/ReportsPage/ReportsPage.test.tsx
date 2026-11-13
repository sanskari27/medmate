import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { afterEach, describe, expect, it } from "vitest";
import { ReportsPage } from "./ReportsPage";

function renderPage() {
  return render(
    <MemoryRouter>
      <ReportsPage />
    </MemoryRouter>,
  );
}

afterEach(() => {
  cleanup();
});

describe("ReportsPage", () => {
  it("searches names and descriptions and shows an empty column", () => {
    renderPage();
    fireEvent.change(screen.getByLabelText("Find report"), { target: { value: "daybook" } });
    expect(screen.getByRole("link", { name: "Daybook" })).toBeTruthy();
    expect(screen.queryByRole("link", { name: "GSTR-1 (Sales)" })).toBeNull();
    expect(screen.getAllByText("No matches").length).toBeGreaterThan(0);

    fireEvent.change(screen.getByLabelText("Find report"), { target: { value: "slab-wise" } });
    expect(screen.getByRole("link", { name: "GSTR-1 (Sales)" })).toBeTruthy();
    expect(screen.getByRole("link", { name: "GSTR-2 (Purchase)" })).toBeTruthy();
    expect(screen.queryByRole("link", { name: "Daybook" })).toBeNull();

    fireEvent.change(screen.getByLabelText("Find report"), { target: { value: "zzzz" } });
    expect(screen.getAllByText("No matches")).toHaveLength(5);
    expect(screen.queryByRole("link", { name: "Daybook" })).toBeNull();
  });

  it("links GSTR-1 to its report and does not show a later-update note", () => {
    renderPage();
    expect(screen.getByRole("link", { name: "GSTR-1 (Sales)" }).getAttribute("href")).toBe(
      "/reports/gstr1",
    );
    expect(screen.queryByText("This report opens in a later update.")).toBeNull();
  });
});
