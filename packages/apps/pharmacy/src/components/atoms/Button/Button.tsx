import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";
import type { ComponentProps } from "react";
import { cn } from "@/utils/className";

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-[7px] border font-bold [line-height:normal] whitespace-nowrap transition focus-visible:outline-none focus-visible:shadow-focus disabled:pointer-events-none disabled:border-transparent disabled:bg-[#e9efeb] disabled:text-faint disabled:shadow-none",
  {
    variants: {
      variant: {
        primary: "border-[rgba(16,48,29,0.1)] bg-mid text-white shadow-sm hover:bg-green",
        secondary: "border-primary bg-paper text-primary hover:bg-wash",
        gold: "border-transparent bg-gold text-deep hover:brightness-95",
        ghost: "border-line-2 bg-paper text-ink-2 hover:bg-wash-2",
        line: "border-line-2 bg-paper text-ink-2 hover:border-mid hover:text-mid",
        rose: "border-rose/20 bg-rose-bg text-rose hover:brightness-95",
        whatsapp: "border-[#25d366] bg-[#25d366] text-white hover:brightness-95",
        link: "border-0 bg-transparent text-mid underline-offset-2 hover:underline",
      },
      size: {
        sm: "rounded-xs px-[11px] py-1.5 text-xs",
        md: "rounded-sm px-[15px] py-[9px] text-[13px]",
        lg: "rounded-sm px-[22px] py-[13px] text-[14.5px]",
      },
      block: {
        true: "w-full",
        false: "",
      },
    },
    compoundVariants: [
      { variant: "link", class: "h-auto rounded-none px-0 py-0" },
    ],
    defaultVariants: {
      variant: "primary",
      size: "md",
      block: false,
    },
  },
);

export type ButtonProps = ComponentProps<"button"> &
  VariantProps<typeof buttonVariants> & {
    asChild?: boolean;
  };

export type ButtonVariant = NonNullable<ButtonProps["variant"]>;
export type ButtonSize = NonNullable<ButtonProps["size"]>;

export function Button({
  className,
  variant,
  size,
  block,
  asChild = false,
  type = "button",
  ...props
}: ButtonProps) {
  const Comp = asChild ? Slot : "button";
  return (
    <Comp
      data-slot="button"
      type={asChild ? undefined : type}
      className={cn(buttonVariants({ variant, size, block }), className)}
      {...props}
    />
  );
}

export { buttonVariants };
