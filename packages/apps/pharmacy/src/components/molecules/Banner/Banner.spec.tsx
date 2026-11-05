import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { Banner } from "./Banner";

describe("Banner", () => {
  it("renders the notice", () => {
    render(<Banner>Connection lost</Banner>);
    expect(screen.getByText("Connection lost")).toBeTruthy();
  });
});
