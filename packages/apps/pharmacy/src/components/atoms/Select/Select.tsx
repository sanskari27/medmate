import { cva, type VariantProps } from "class-variance-authority";
import type { ComponentProps } from "react";
import { cn } from "@/utils/className";

const selectVariants = cva(
  "w-full rounded-sm border border-line-2 bg-paper px-3 py-[9px] text-[13.5px] leading-[1.5] text-ink outline-none transition-[border-color,box-shadow] duration-[140ms] max-[767px]:text-[16px] hover:border-[#b9d0c2] focus:border-mid focus:shadow-focus disabled:cursor-not-allowed",
  {
    variants: {
      controlSize: {
        sm: "py-1.5 text-xs",
        md: "",
        lg: "py-3",
      },
    },
    defaultVariants: {
      controlSize: "md",
    },
  },
);

export type SelectOption = {
  value: string;
  label: string;
  disabled?: boolean;
};

export type SelectProps = Omit<ComponentProps<"select">, "children"> &
  VariantProps<typeof selectVariants> & {
    options?: readonly SelectOption[];
  };

function renderOption(option: SelectOption, index: number) {
  return (
    <option key={`${option.value}-${index}`} value={option.value} disabled={option.disabled}>
      {option.label}
    </option>
  );
}

export function DataList({ id, options }: { id: string; options: readonly SelectOption[] }) {
  return <datalist id={id}>{(options ?? []).map(renderOption)}</datalist>;
}

export function Select({ className, controlSize, options, ...props }: SelectProps) {
  return (
    <select data-slot="select" className={cn(selectVariants({ controlSize }), className)} {...props}>
      {(options ?? []).map(renderOption)}
    </select>
  );
}

export { selectVariants };
