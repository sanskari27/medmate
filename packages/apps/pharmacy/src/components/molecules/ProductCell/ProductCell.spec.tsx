import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { ProductCell } from "./ProductCell";

describe("ProductCell", () => {
  it("shows a monogram, name, and subtitle", () => {
    render(<ProductCell name="Crocin" subtitle="Strip of 15" />);
    expect(screen.getByText("C")).toBeTruthy();
    expect(screen.getByText("Crocin")).toBeTruthy();
    expect(screen.getByText("Strip of 15")).toBeTruthy();
  });

  it("uses a photo when one is provided", () => {
    render(<ProductCell name="Crocin" src="https://example.com/crocin.png" alt="Crocin pack" />);
    const image = screen.getByRole("img", { name: "Crocin pack" }) as HTMLImageElement;
    expect(image.src).toBe("https://example.com/crocin.png");
  });
});
