import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { emptyCrmView } from "../crmView";
import { Loyalty } from "./Loyalty";

describe("Loyalty", () => {
  it("renders the empty CRM view", () => {
    render(<Loyalty view={emptyCrmView} />);
    expect(screen.getByText("Points outstanding")).toBeTruthy();
  });
});
