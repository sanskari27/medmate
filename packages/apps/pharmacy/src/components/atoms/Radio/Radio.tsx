import { cva, type VariantProps } from "class-variance-authority";
import type { ComponentProps, ReactNode } from "react";
import { cn } from "@/utils/className";

const radioVariants = cva("accent-mid", {
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

export type RadioProps = Omit<ComponentProps<"input">, "type" | "size"> &
  VariantProps<typeof radioVariants> & {
    children?: ReactNode;
  };

export function Radio({ className, controlSize, children, ...props }: RadioProps) {
  return (
    <label data-slot="radio" className="inline-flex items-center gap-2 text-[13px] text-ink">
      <input type="radio" className={cn(radioVariants({ controlSize }), className)} {...props} />
      {children}
    </label>
  );
}

export { radioVariants };
