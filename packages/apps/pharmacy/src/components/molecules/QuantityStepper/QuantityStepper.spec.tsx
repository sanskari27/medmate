import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { QuantityStepper } from "./QuantityStepper";

afterEach(function clearDom() {
  cleanup();
});

describe("QuantityStepper", () => {
  it("steps, caps typed values, and resets an empty field", () => {
    const onDec = vi.fn();
    const onInc = vi.fn();
    const onSet = vi.fn();
    const onRemove = vi.fn();
    render(
      <QuantityStepper
        qty={2}
        min={1}
        max={3}
        onDec={onDec}
        onInc={onInc}
        onSet={onSet}
        onRemove={onRemove}
      />,
    );

    fireEvent.click(screen.getByRole("button", { name: "decrease" }));
    expect(onDec).toHaveBeenCalledTimes(1);

    const input = screen.getByRole("textbox", { name: "quantity" }) as HTMLInputElement;
    fireEvent.change(input, { target: { value: "4" } });
    expect(onSet).toHaveBeenCalledWith(3);

    fireEvent.change(input, { target: { value: "" } });
    fireEvent.blur(input);
    expect(input.value).toBe("2");

    fireEvent.click(screen.getByRole("button", { name: "remove item" }));
    expect(onRemove).toHaveBeenCalledTimes(1);
  });

  it("disables increase at the max", () => {
    const view = render(
      <QuantityStepper qty={3} max={3} onDec={vi.fn()} onInc={vi.fn()} onSet={vi.fn()} />,
    );
    const increase = view.getByRole("button", { name: "increase" }) as HTMLButtonElement;
    expect(increase.disabled).toBe(true);
  });
});
