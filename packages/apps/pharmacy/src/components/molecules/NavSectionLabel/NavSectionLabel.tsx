import { cva } from "class-variance-authority";
import type { ComponentProps } from "react";
import { Text } from "@/components/atoms/Text";
import { cn } from "@/utils/className";

const navSectionLabelVariants = cva(
  "block px-2.5 pt-4 pb-1.5 text-[10px] font-extrabold tracking-[0.14em] text-[#8fd4a87a] uppercase",
);

export type NavSectionLabelProps = ComponentProps<typeof Text>;

export function NavSectionLabel({ className, ...props }: NavSectionLabelProps) {
  return (
    <Text
      data-slot="nav-section-label"
      as="span"
      className={cn(navSectionLabelVariants(), className)}
      {...props}
    />
  );
}

export { navSectionLabelVariants };
