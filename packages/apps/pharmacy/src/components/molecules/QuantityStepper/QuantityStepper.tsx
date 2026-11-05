import { useEffect, useState, type ChangeEvent, type FocusEvent } from "react";
import { Button } from "@/components/atoms/Button";
import { Input } from "@/components/atoms/Input";
import { Stack } from "@/components/atoms/Stack";
import { cn } from "@/utils/className";

export type QuantityStepperProps = {
  qty: number;
  min?: number;
  max?: number;
  onDec: () => void;
  onInc: () => void;
  onSet: (next: number) => void;
  onRemove?: () => void;
};

const stepButtonClass =
  "h-7 w-[26px] rounded-none border-0 bg-wash-2 p-0 text-[15px] font-extrabold text-mid shadow-none hover:bg-wash disabled:bg-wash-2 disabled:text-mid disabled:opacity-40";

export function QuantityStepper({
  qty,
  min = 1,
  max,
  onDec,
  onInc,
  onSet,
  onRemove,
}: QuantityStepperProps) {
  const [text, setText] = useState(String(qty));
  useEffect(
    function syncQty() {
      setText(String(qty));
    },
    [qty],
  );

  function cap(value: number) {
    if (max == null) return value;
    return Math.min(max, value);
  }

  const atMax = max != null && qty >= max;

  function changeText(event: ChangeEvent<HTMLInputElement>) {
    const digits = event.target.value.replace(/[^0-9]/g, "");
    setText(digits);
    const next = Number(digits);
    if (digits !== "" && next >= min) onSet(cap(next));
  }

  function commitText() {
    const next = Math.floor(Number(text));
    if (text.trim() === "" || Number.isNaN(next) || next < min) {
      setText(String(qty));
      return;
    }
    const capped = cap(next);
    onSet(capped);
    setText(String(capped));
  }

  function selectInput(event: FocusEvent<HTMLInputElement>) {
    event.target.select();
  }

  return (
    <Stack
      data-slot="quantity-stepper"
      data-field="qty"
      direction="row"
      align="center"
      className="inline-flex overflow-hidden rounded-sm border border-line-2"
    >
      <Button type="button" variant="ghost" className={stepButtonClass} onClick={onDec} aria-label="decrease">
        −
      </Button>
      <Input
        variant="plain"
        className="h-7 w-[38px] shrink-0 rounded-none border-x border-y-0 border-line bg-paper px-0 py-0 text-center font-display text-[13px] font-extrabold text-dark shadow-none focus:bg-wash-2 focus:shadow-none"
        type="text"
        inputMode="numeric"
        value={text}
        aria-label="quantity"
        onFocus={selectInput}
        onChange={changeText}
        onBlur={commitText}
      />
      <Button
        type="button"
        variant="ghost"
        className={stepButtonClass}
        onClick={onInc}
        disabled={atMax}
        aria-label="increase"
      >
        +
      </Button>
      {onRemove ? (
        <Button
          type="button"
          variant="ghost"
          className={cn(stepButtonClass, "border-l border-line text-[#c0392b] hover:bg-[#fdecec] hover:text-[#b02a2a]")}
          onClick={onRemove}
          aria-label="remove item"
          title="Remove item"
        >
          ×
        </Button>
      ) : null}
    </Stack>
  );
}
