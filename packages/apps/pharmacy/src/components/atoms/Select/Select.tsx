import { cva, type VariantProps } from "class-variance-authority";
import type { ComponentProps } from "react";
import { cn } from "@/utils/className";

const selectVariants = cva(
  "w-full rounded-sm border border-line-2 bg-paper px-3 py-[9px] text-[13.5px] [line-height:normal] text-ink outline-none transition max-[767px]:text-[16px] focus:border-mid focus:shadow-focus disabled:bg-wash disabled:text-faint",
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
