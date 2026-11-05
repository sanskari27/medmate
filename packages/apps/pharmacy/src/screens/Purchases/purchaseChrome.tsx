import { useState, type MouseEvent } from "react";
import { Select, type SelectProps } from "@/components/atoms";
import { cn } from "@/utils/className";

const CHEVRON = {
  mid: "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='16' height='16' viewBox='0 0 24 24' fill='none' stroke='%232F7D52' stroke-width='2.2' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpath d='m6 9 6 6 6-6'/%3E%3C/svg%3E\")",
  dark: "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='16' height='16' viewBox='0 0 24 24' fill='none' stroke='%231B3D29' stroke-width='2.2' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpath d='m6 9 6 6 6-6'/%3E%3C/svg%3E\")",
  faint:
    "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='16' height='16' viewBox='0 0 24 24' fill='none' stroke='%238AAE9A' stroke-width='2.2' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpath d='m6 9 6 6 6-6'/%3E%3C/svg%3E\")",
};

export function ChevronSelect({
  className,
  style,
  disabled,
  dense = false,
  onMouseEnter,
  onMouseLeave,
  ...props
}: SelectProps & { dense?: boolean }) {
  const [hover, setHover] = useState(false);
  const image = disabled ? CHEVRON.faint : hover ? CHEVRON.dark : CHEVRON.mid;
  function handleEnter(event: MouseEvent<HTMLSelectElement>) {
    setHover(true);
    onMouseEnter?.(event);
  }
  function handleLeave(event: MouseEvent<HTMLSelectElement>) {
    setHover(false);
    onMouseLeave?.(event);
  }
  return (
    <Select
      {...props}
      disabled={disabled}
      className={cn(
        "!appearance-none !bg-no-repeat !bg-[length:16px_16px] disabled:!cursor-not-allowed",
        dense ? "!py-[7px] !pr-7 !pl-2 !text-[12.5px]" : "!pr-[34px]",
        className,
      )}
      style={{
        ...style,
        backgroundImage: image,
        backgroundPosition: dense ? "right 7px center" : "right 11px center",
        backgroundRepeat: "no-repeat",
      }}
      onMouseEnter={handleEnter}
      onMouseLeave={handleLeave}
    />
  );
}

export const dataTableClass =
  "!w-full !border-separate !border-spacing-0 !text-[13px] [&_tr]:!border-0 [&_tbody_tr]:transition-colors [&_tbody_tr:hover]:!bg-wash-2 [&_th]:!sticky [&_th]:!top-0 [&_th]:!z-[1] [&_th]:!border-b [&_th]:!border-line [&_th]:!bg-wash-2 [&_th]:!px-3.5 [&_th]:!py-[11px] [&_th]:!text-left [&_th]:!text-[10.5px] [&_th]:!font-bold [&_th]:!uppercase [&_th]:!tracking-[0.07em] [&_th]:!whitespace-nowrap [&_th]:text-muted [&_td]:!border-b [&_td]:!border-line [&_td]:!px-3.5 [&_td]:!py-[11px] [&_td]:!align-middle [&_td]:text-ink-2";

export const tableLastRowClass = "[&_tbody_tr:last-child_td]:!border-b-0";

export const numClass = "!text-right !font-semibold !text-ink !tabular-nums";

export const modalOverlayClass =
  "!fixed !inset-0 !z-[100] !flex !items-center !justify-center !bg-[#0d201580] !p-6 !backdrop-blur-[3px] max-[767px]:!items-end max-[767px]:!p-0";

export const modalPanelClass =
  "!flex !max-h-[90vh] !w-full !flex-col !overflow-hidden !rounded-lg !bg-paper !shadow-pop max-[767px]:!max-h-[92dvh] max-[767px]:!max-w-none max-[767px]:!rounded-b-none max-[767px]:!rounded-t-2xl";

export const modalHeadClass =
  "!flex !items-center !justify-between !border-b !border-line !px-5 !py-4 [&_h3]:!text-[17px] [&_h3]:!font-extrabold [&_h3]:!tracking-[-0.02em]";

export const modalBodyClass = "!overflow-y-auto !p-5";

export const modalFootClass =
  "!mt-auto !flex !justify-end !gap-2.5 !border-t !border-line !px-5 !py-3.5 max-[767px]:!flex-wrap max-[767px]:[&_button]:!min-w-0 max-[767px]:[&_button]:!flex-1";

export const closeButtonClass =
  "!grid !h-8 !w-8 !place-items-center !rounded-sm !border-0 !bg-wash-2 !p-0 !text-[18px] !text-ink-2 !shadow-none hover:!bg-wash active:!translate-y-0";

export const grnGridClass =
  "!mb-4 !grid !grid-cols-3 !gap-3.5 max-[1099px]:!grid-cols-2 max-[767px]:!grid-cols-1";

export const statCardClass =
  "!relative !flex !flex-col !overflow-hidden !rounded-md !border !border-line !bg-paper !px-[18px] !py-4 !shadow-sm";

export const statIconClass = "!grid !h-8 !w-8 !place-items-center !rounded-[9px] !text-[17px]";

export const statLabelClass =
  "!mt-3 !text-[11px] !font-bold !tracking-[0.05em] !text-muted !uppercase";

export const statValueClass =
  "!mt-[3px] !mb-2.5 !font-display !text-[26px] !font-extrabold !tracking-[-0.03em] !text-dark !tabular-nums max-[767px]:!text-[22px]";

export const statSplitClass =
  "!mt-auto !block !border-t !border-line !pt-[9px] !text-xs !text-muted";

export const fieldClass =
  "!flex !flex-col !gap-1.5 [&_label]:!text-[11.5px] [&_label]:!font-bold [&_label]:!tracking-[0.01em] [&_label]:!text-ink-2";

export const denseFieldClass =
  "!flex !flex-col !gap-1.5 [&_label]:!text-[10.5px] [&_label]:!font-bold [&_label]:!tracking-[0.01em] [&_label]:!text-ink-2";

export const denseInputClass = "!px-2 !py-[7px] !text-[12.5px]";

export const toolbarControlClass =
  "max-[767px]:!w-auto max-[767px]:!max-w-none max-[767px]:!min-w-0 max-[767px]:!flex-[1_1_140px]";

export const formGridClass = "!grid !grid-cols-2 !gap-3.5 max-[767px]:!grid-cols-1";

export const span2Class = "!col-span-2 max-[767px]:!col-span-1";
