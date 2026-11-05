import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { emptyCrmView } from "../crmView";
import { Analytics } from "./Analytics";

describe("Analytics", () => {
  it("renders the empty CRM view", () => {
    render(<Analytics view={emptyCrmView} />);
    expect(screen.getByText("Top patients by RFM")).toBeTruthy();
  });
});
