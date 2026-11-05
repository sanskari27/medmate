import { cva, type VariantProps } from "class-variance-authority";
import type { ComponentProps } from "react";
import { cn } from "@/utils/className";

const switchVariants = cva(
  "relative h-6 w-11 rounded-full transition after:absolute after:top-0.5 after:h-5 after:w-5 after:rounded-full after:bg-paper after:transition after:content-['']",
  {
    variants: {
      checked: {
        true: "bg-mid after:translate-x-4",
        false: "bg-line-2 after:translate-x-0.5",
      },
    },
    defaultVariants: {
      checked: false,
    },
  },
);

export type SwitchProps = Omit<ComponentProps<"button">, "role"> &
  VariantProps<typeof switchVariants> & {
    checked: boolean;
    label: string;
  };

export function Switch({ className, checked, label, type = "button", ...props }: SwitchProps) {
  return (
    <button
      data-slot="switch"
      type={type}
      role="switch"
      aria-checked={checked}
      aria-label={label}
      className={cn(switchVariants({ checked }), className)}
      {...props}
    />
  );
}

export { switchVariants };
