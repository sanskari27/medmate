import type { ComponentProps } from "react";
import { IconStore } from "@/components/atoms/Icon";
import { Stack } from "@/components/atoms/Stack";
import { Text } from "@/components/atoms/Text";
import { cn } from "@/utils/className";

export type StoreChipProps = Omit<ComponentProps<typeof Stack>, "children"> & {
  name: string;
  open: boolean;
};

export function StoreChip({ className, name, open, ...props }: StoreChipProps) {
  return (
    <Stack
      data-slot="store-chip"
      direction="row"
      align="center"
      gap={2}
      className={cn(
        "mx-3.5 mb-2.5 rounded-[10px] border border-white/10 bg-[#ffffff0f] px-[11px] py-[9px] text-white",
        className,
      )}
      {...props}
    >
      <IconStore size={18} />
      <Stack gap={0} className="min-w-0">
        <Text as="span" className="text-[12px] leading-[1.3] font-bold text-white">
          {name}
        </Text>
        <Text as="span" className="block text-[10px] leading-[1.3] font-semibold text-mint">
          {open ? "● Online · accepting orders" : "○ Online store paused"}
        </Text>
      </Stack>
    </Stack>
  );
}
