import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { emptyCrmView } from "../crmView";
import { Reminders } from "./Reminders";

describe("Reminders", () => {
  it("renders the empty CRM view", () => {
    render(<Reminders view={emptyCrmView} />);
    expect(screen.getByText("No refills due in the next 14 days.")).toBeTruthy();
  });
});
