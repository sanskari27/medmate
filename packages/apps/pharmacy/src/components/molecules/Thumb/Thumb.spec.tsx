import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import type { InvProduct } from "@/utils";
import { Thumb } from "./Thumb";

const product = { name: "Dolo", batches: [] } as unknown as InvProduct;

describe("Thumb", () => {
  it("falls back to a monogram", () => {
    render(<Thumb p={product} />);
    expect(screen.getByText("D")).toBeTruthy();
  });

  it("shows the product photo", () => {
    render(<Thumb p={{ ...product, image: "https://example.com/dolo.png" }} />);
    const image = screen.getByRole("img", { name: "Dolo" }) as HTMLImageElement;
    expect(image.src).toBe("https://example.com/dolo.png");
  });
});
