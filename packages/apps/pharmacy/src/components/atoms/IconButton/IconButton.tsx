import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";
import type { ComponentProps } from "react";
import { cn } from "@/utils/className";

const iconButtonVariants = cva(
  "grid place-items-center rounded-xs transition focus-visible:outline-none focus-visible:shadow-focus",
  {
    variants: {
      variant: {
        default:
          "h-8 w-8 border border-line-2 bg-paper text-ink-2 hover:bg-wash-2 hover:text-mid disabled:cursor-not-allowed disabled:opacity-[0.35]",
        close: "h-8 w-8 border-0 bg-transparent text-muted hover:text-ink",
        ghost: "h-8 w-8 border-0 bg-transparent text-ink-2 hover:bg-wash",
      },
      size: {
        sm: "h-7 w-7",
        md: "h-8 w-8",
        lg: "h-10 w-10",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "md",
    },
  },
);

export type IconButtonProps = ComponentProps<"button"> &
  VariantProps<typeof iconButtonVariants> & {
    label: string;
    asChild?: boolean;
  };

export function IconButton({
  className,
  variant,
  size,
  label,
  asChild = false,
  type = "button",
  ...props
}: IconButtonProps) {
  const Comp = asChild ? Slot : "button";
  return (
    <Comp
      data-slot="icon-button"
      type={asChild ? undefined : type}
      aria-label={label}
      className={cn(iconButtonVariants({ variant, size }), className)}
      {...props}
    />
  );
}

export { iconButtonVariants };
