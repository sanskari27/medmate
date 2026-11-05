import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { emptyCrmView } from "../crmView";
import { Campaigns } from "./Campaigns";

describe("Campaigns", () => {
  it("renders the empty CRM view", () => {
    render(<Campaigns view={emptyCrmView} />);
    expect(screen.getByText("No campaigns yet.")).toBeTruthy();
  });
});
