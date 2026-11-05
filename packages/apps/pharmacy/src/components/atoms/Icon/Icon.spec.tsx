import { render } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { IconDashboard } from "./Icon";

describe("Icon", () => {
  it("draws a dashboard glyph", () => {
    const view = render(<IconDashboard />);
    expect(view.container.querySelector("svg")).toBeTruthy();
  });
});
