import { cva, type VariantProps } from "class-variance-authority";
import type { ComponentProps } from "react";
import { cn } from "@/utils/className";

const inputVariants = cva(
  "w-full text-[13.5px] text-ink outline-none transition disabled:bg-wash disabled:text-faint",
  {
    variants: {
      variant: {
        default:
          "rounded-sm border border-line-2 bg-paper px-3 py-[9px] focus:border-mid focus:shadow-focus",
        plain: "border-0 bg-transparent px-0 py-2 shadow-none focus:shadow-none",
      },
      controlSize: {
        sm: "py-1.5 text-xs",
        md: "",
        lg: "py-3 text-[14.5px]",
      },
    },
    defaultVariants: {
      variant: "default",
      controlSize: "md",
    },
  },
);

export type InputProps = Omit<ComponentProps<"input">, "size"> & VariantProps<typeof inputVariants>;

export function Input({ className, variant, controlSize, ...props }: InputProps) {
  return (
    <input data-slot="input" className={cn(inputVariants({ variant, controlSize }), className)} {...props} />
  );
}

export { inputVariants };
