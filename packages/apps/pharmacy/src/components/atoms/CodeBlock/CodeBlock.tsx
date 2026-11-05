import { cva, type VariantProps } from "class-variance-authority";
import type { ComponentProps } from "react";
import { cn } from "@/utils/className";

const codeBlockVariants = cva(
  "overflow-auto whitespace-pre-wrap rounded-md bg-[#16241c] p-3 font-mono text-[11.5px] leading-relaxed text-[#d7ebe0]",
  {
    variants: {
      size: {
        sm: "max-h-[160px]",
        md: "max-h-[220px]",
      },
    },
    defaultVariants: {
      size: "md",
    },
  },
);

export type CodeBlockProps = ComponentProps<"pre"> & VariantProps<typeof codeBlockVariants>;

export function CodeBlock({ className, size, ...props }: CodeBlockProps) {
  return <pre data-slot="code-block" className={cn(codeBlockVariants({ size }), className)} {...props} />;
}

export { codeBlockVariants };
