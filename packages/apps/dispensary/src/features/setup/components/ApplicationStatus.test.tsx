import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
import { ApplicationStatus } from "./ApplicationStatus";

afterEach(() => {
  cleanup();
});

function progressValue() {
  return screen
    .getByRole("progressbar", { name: "Application review" })
    .getAttribute("aria-valuenow");
}

function line(title: string) {
  return screen.getByText(title).closest("[role='listitem']")?.textContent ?? "";
}

describe("ApplicationStatus", () => {
  it("shows compliance as the current review", () => {
    render(<ApplicationStatus status="pending_compliance" />);

    expect(screen.getByRole("heading", { name: "Your application is under review" })).toBeTruthy();
    expect(screen.getAllByText("Compliance is reviewing this application.")).toHaveLength(2);
    expect(progressValue()).toBe("1");
    expect(line("Submitted")).toContain("Done");
    expect(line("Submitted")).toContain("We have your application.");
    expect(line("Compliance review")).toContain("In review");
    expect(line("Admin review")).toContain("Waiting");
    expect(line("Admin review")).toContain("Admin review starts after compliance.");
  });

  it("shows admin as the current review after compliance is done", () => {
    render(<ApplicationStatus status="pending_admin" />);

    expect(screen.getAllByText("Admin is doing the final review.")).toHaveLength(2);
    expect(progressValue()).toBe("2");
    expect(line("Submitted")).toContain("Done");
    expect(line("Compliance review")).toContain("Done");
    expect(line("Compliance review")).toContain("Compliance approved this application.");
    expect(line("Admin review")).toContain("In review");
  });
});
