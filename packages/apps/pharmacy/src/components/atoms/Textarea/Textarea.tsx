import { cva, type VariantProps } from "class-variance-authority";
import type { ComponentProps } from "react";
import { cn } from "@/utils/className";

const textareaVariants = cva(
  "w-full min-h-16 resize-y rounded-sm border border-line-2 bg-paper px-3 py-[9px] text-[13.5px] [line-height:normal] text-ink outline-none transition-[border-color,box-shadow] duration-[140ms] placeholder:text-faint max-[767px]:text-[16px] hover:border-[#b9d0c2] focus:border-mid focus:shadow-focus",
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
    <textarea
      data-slot="textarea"
      className={cn(textareaVariants({ resize }), className)}
      {...props}
    />
  );
}

export { textareaVariants };
