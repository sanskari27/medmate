import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { Image } from "./Image";

describe("Image", () => {
  it("requires an alt and renders an image", () => {
    render(<Image alt="Store logo" src="/logo.png" />);
    expect(screen.getByRole("img", { name: "Store logo" })).toBeTruthy();
  });
});
