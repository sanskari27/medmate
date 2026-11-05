import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { Tag } from "./Tag";

describe("Tag", () => {
  it("renders the tag text", () => {
    render(<Tag tone="otc">OTC</Tag>);
    expect(screen.getByText("OTC")).toBeTruthy();
  });
});
