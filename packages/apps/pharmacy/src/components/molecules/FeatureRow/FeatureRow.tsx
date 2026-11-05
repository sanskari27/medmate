import { cva } from "class-variance-authority";
import type { ReactNode } from "react";
import { Box } from "@/components/atoms/Box";
import { Stack } from "@/components/atoms/Stack";
import { Switch } from "@/components/atoms/Switch";
import { Text } from "@/components/atoms/Text";
import { cn } from "@/utils/className";

const featureRowVariants = cva("mb-2.5 rounded-xl border border-line px-3.5 py-3");

export type FeatureRowProps = {
  ico: ReactNode;
  t: string;
  s: string;
  on: boolean;
  onClick: () => void;
  className?: string;
};

export function FeatureRow({ className, ico, t, s, on, onClick }: FeatureRowProps) {
  return (
    <Stack
      data-slot="feature-row"
      direction="row"
      align="center"
      gap={3}
      className={cn(featureRowVariants(), className)}
    >
      <Box className="grid h-[38px] w-[38px] shrink-0 place-items-center rounded-[10px] bg-wash text-mid">
        {ico}
      </Box>
      <Stack gap={0} className="min-w-0 flex-1">
        <Text as="span" className="text-[13.5px] font-bold text-ink">
          {t}
        </Text>
        <Text as="span" variant="caption" className="text-[12px]">
          {s}
        </Text>
      </Stack>
      <Switch checked={on} label={t} onClick={onClick} />
    </Stack>
  );
}

export { featureRowVariants };
