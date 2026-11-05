import { cva, type VariantProps } from "class-variance-authority";
import type { ComponentProps } from "react";
import { cn } from "@/utils/className";

const tagVariants = cva("inline-flex items-center gap-1 rounded-xs border px-[7px] py-0.5 text-[10.5px] font-bold", {
  variants: {
    tone: {
      default: "border-line-2 bg-paper text-ink-2",
      rx: "border-rose/30 bg-rose-bg text-rose",
      otc: "border-mint bg-wash text-mid",
    },
  },
  defaultVariants: {
    tone: "default",
  },
});

export type TagProps = ComponentProps<"span"> & VariantProps<typeof tagVariants>;
export type TagTone = NonNullable<TagProps["tone"]>;

export function Tag({ className, tone, ...props }: TagProps) {
  return <span data-slot="tag" className={cn(tagVariants({ tone }), className)} {...props} />;
}

export { tagVariants };
