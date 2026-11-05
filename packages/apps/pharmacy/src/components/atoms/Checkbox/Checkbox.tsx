import { cva, type VariantProps } from "class-variance-authority";
import type { ComponentProps, ReactNode } from "react";
import { cn } from "@/utils/className";

const checkboxVariants = cva("accent-mid", {
  variants: {
    controlSize: {
      sm: "h-3.5 w-3.5",
      md: "h-4 w-4",
    },
  },
  defaultVariants: {
    controlSize: "md",
  },
});

export type CheckboxProps = Omit<ComponentProps<"input">, "type" | "size"> &
  VariantProps<typeof checkboxVariants> & {
    children?: ReactNode;
  };

export function Checkbox({ className, controlSize, children, ...props }: CheckboxProps) {
  return (
    <label data-slot="checkbox" className="inline-flex items-center gap-2 text-[13px] text-ink">
      <input type="checkbox" className={cn(checkboxVariants({ controlSize }), className)} {...props} />
      {children}
    </label>
  );
}

export { checkboxVariants };
