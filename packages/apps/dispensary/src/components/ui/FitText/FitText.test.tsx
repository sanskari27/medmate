import { render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { FitText } from "./FitText";

const originalComputed = window.getComputedStyle;

afterEach(() => {
  vi.restoreAllMocks();
});

describe("FitText", () => {
  it("shrinks a rupee amount until it fits the card", () => {
    vi.spyOn(HTMLElement.prototype, "clientWidth", "get").mockImplementation(function (
      this: HTMLElement,
    ) {
      return this.textContent?.includes("₹") ? 80 : 400;
    });
    vi.spyOn(HTMLElement.prototype, "scrollWidth", "get").mockImplementation(function (
      this: HTMLElement,
    ) {
      if (!this.textContent?.includes("₹")) return 40;
      const size = Number.parseFloat(this.style.fontSize || "22");
      return size > 14 ? 200 : 70;
    });
    vi.spyOn(window, "getComputedStyle").mockImplementation((element: Element) => {
      const style = originalComputed(element);
      return new Proxy(style, {
        get(target, prop, receiver) {
          if (prop === "fontSize") return "22px";
          const value: unknown = Reflect.get(target, prop, receiver);
          return typeof value === "function" ? value.bind(target) : value;
        },
      });
    });

    render(<FitText className="text-[22px] font-bold">₹12,34,56,789.00</FitText>);

    expect(screen.getByText("₹12,34,56,789.00").style.fontSize).toBe("14px");
  });

  it("keeps the full amount available when it already fits", () => {
    vi.spyOn(HTMLElement.prototype, "clientWidth", "get").mockReturnValue(240);
    vi.spyOn(HTMLElement.prototype, "scrollWidth", "get").mockReturnValue(120);
    vi.spyOn(window, "getComputedStyle").mockImplementation((element: Element) => {
      const style = originalComputed(element);
      return new Proxy(style, {
        get(target, prop, receiver) {
          if (prop === "fontSize") return "22px";
          const value: unknown = Reflect.get(target, prop, receiver);
          return typeof value === "function" ? value.bind(target) : value;
        },
      });
    });

    render(<FitText>₹120</FitText>);

    expect(screen.getByText("₹120").style.fontSize).toBe("");
  });
});
