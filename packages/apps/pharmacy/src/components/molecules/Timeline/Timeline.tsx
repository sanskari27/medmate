import type { ComponentProps, ReactNode } from "react";
import { Box } from "@/components/atoms/Box";
import { Stack } from "@/components/atoms/Stack";
import { Text } from "@/components/atoms/Text";
import { cn } from "@/utils/className";

export type TimelineTone = "neutral" | "bad";

export type TimelineItem = {
  label: string;
  time: string;
  tone?: TimelineTone;
};

export type TimelineProps = Omit<ComponentProps<typeof Stack>, "children"> & {
  items: TimelineItem[];
};

function TimelineRow({ item }: { item: TimelineItem }) {
  const tone = item.tone ?? "neutral";
  return (
    <Box
      display="grid"
      className="grid-cols-[16px_1fr_auto] items-center gap-2 py-[3px] text-[12.5px]"
    >
      <Box
        className={cn(
          "h-[9px] w-[9px] justify-self-center rounded-full bg-mid",
          tone === "bad" && "bg-rose",
        )}
      />
      <Text as="span" className="font-semibold text-ink">
        {item.label}
      </Text>
      <Text as="span" variant="caption" className="text-[11px] whitespace-nowrap">
        {item.time}
      </Text>
    </Box>
  );
}

export function Timeline({ className, items, ...props }: TimelineProps) {
  const rows: ReactNode[] = [];
  for (let index = 0; index < items.length; index += 1) {
    const item = items[index];
    if (!item) continue;
    rows.push(<TimelineRow key={`${item.label}-${index}`} item={item} />);
  }
  return (
    <Stack data-slot="timeline" className={cn(className)} {...props}>
      {rows}
    </Stack>
  );
}
