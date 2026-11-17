import { cva, type VariantProps } from "class-variance-authority";
import type { ComponentProps } from "react";
import { cn } from "@/lib/cn";

const inputVariants = cva(
  "w-full rounded-control border border-line-2 bg-surface px-3 py-2 text-[14px] text-ink outline-none transition-colors placeholder:text-faint focus:border-green",
  {
    variants: {
      size: {
        sm: "h-8 text-[13px]",
        md: "h-10",
        lg: "h-12 text-[14.5px]",
      },
    },
    defaultVariants: {
      size: "md",
    },
  },
);

export type InputProps = Omit<ComponentProps<"input">, "size"> & VariantProps<typeof inputVariants>;

export function Input({ className, size, ...props }: InputProps) {
  return <input data-slot="input" className={cn(inputVariants({ size }), className)} {...props} />;
}
