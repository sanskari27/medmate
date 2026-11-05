import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { emptyCrmView } from "../crmView";
import { Overview } from "./Overview";

describe("Overview", () => {
  it("renders the empty CRM view", () => {
    render(<Overview view={emptyCrmView} />);
    expect(screen.getByText("No refills due in 7 days.")).toBeTruthy();
  });
});
