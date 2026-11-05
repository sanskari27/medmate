import { cva, type VariantProps } from "class-variance-authority";
import type { ComponentProps } from "react";
import { cn } from "@/utils/className";

const textareaVariants = cva(
  "w-full rounded-sm border border-line-2 bg-paper px-3 py-[9px] text-[13.5px] text-ink outline-none transition focus:border-mid focus:shadow-focus disabled:bg-wash disabled:text-faint",
  {
    variants: {
      resize: {
        none: "resize-none",
        vertical: "resize-y",
      },
    },
    defaultVariants: {
      resize: "vertical",
    },
  },
);

export type TextareaProps = ComponentProps<"textarea"> & VariantProps<typeof textareaVariants>;

export function Textarea({ className, resize, ...props }: TextareaProps) {
  return (
    <textarea data-slot="textarea" className={cn(textareaVariants({ resize }), className)} {...props} />
  );
}

export { textareaVariants };
