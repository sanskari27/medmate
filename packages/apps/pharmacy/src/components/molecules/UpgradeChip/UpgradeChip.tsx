import { cva } from "class-variance-authority";
import type { ComponentProps } from "react";
import { Button } from "@/components/atoms/Button";
import { IconCrown } from "@/components/atoms/Icon";
import { Text } from "@/components/atoms/Text";
import { cn } from "@/utils/className";

const upgradeChipVariants = cva(
  "h-auto gap-1.5 rounded-[10px] border-gold bg-gradient-to-r from-amber-bg to-paper px-3 py-2 text-[12.5px] font-extrabold whitespace-nowrap text-gold-d shadow-none hover:border-gold hover:from-amber-bg hover:to-amber-bg hover:text-gold-d",
);

export type UpgradeChipProps = ComponentProps<typeof Button>;

export function UpgradeChip({ className, children, type = "button", ...props }: UpgradeChipProps) {
  return (
    <Button
      data-slot="upgrade-chip"
      type={type}
      variant="ghost"
      className={cn(upgradeChipVariants(), className)}
      {...props}
    >
      <IconCrown size={14} />
      {children ?? (
        <Text as="span" className="text-[12.5px] font-extrabold text-gold-d max-[767px]:sr-only">
          Essential · Upgrade
        </Text>
      )}
    </Button>
  );
}

export { upgradeChipVariants };
