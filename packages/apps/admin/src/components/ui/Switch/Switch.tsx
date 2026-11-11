import { cva, type VariantProps } from "class-variance-authority";
import type { ComponentProps } from "react";
import { cn } from "@/utils/className";

const switchVariants = cva(
  "relative h-[22px] w-[38px] shrink-0 rounded-[11px] border-0 p-0 transition after:absolute after:top-0.5 after:left-0.5 after:h-[18px] after:w-[18px] after:rounded-full after:bg-paper after:shadow-[0_1px_3px_rgba(0,0,0,0.22)] after:transition after:content-[''] disabled:opacity-50",
  {
    variants: {
      checked: {
        true: "bg-rose after:translate-x-4",
        false: "bg-[#cddcd3] after:translate-x-0",
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
