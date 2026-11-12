import type { ChangeEvent } from "react";

export const cardClass =
  "flex flex-col gap-4 rounded-md border border-line bg-paper p-[18px] shadow-sm";

export const areaClass =
  "min-h-16 w-full resize-y rounded-sm border border-line-2 bg-paper px-3 py-[9px] text-[13.5px] text-ink outline-none focus:border-mid focus:shadow-focus";

export function onValue(onChange: (value: string) => void) {
  return (event: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
    onChange(event.target.value);
}
