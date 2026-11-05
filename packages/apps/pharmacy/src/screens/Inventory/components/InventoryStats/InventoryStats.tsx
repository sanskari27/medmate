import type { KeyboardEvent, ReactNode } from "react";
import { Box } from "@/components/atoms/Box";
import { Text } from "@/components/atoms/Text";
import {
  IconArrowRight,
  IconCalendar,
  IconCash,
  IconClock,
  IconInventory,
  IconTag,
  IconTrendDown,
} from "@/components/atoms/Icon";
import { inr } from "@/utils";
import { cn } from "@/utils/className";
import type { InventoryStatsProps } from "./InventoryStats.types";

export function InventoryStats({ snapshot, onFilter }: InventoryStatsProps) {
  function showAll() {
    onFilter("all");
  }
  function showLow() {
    onFilter("low");
  }
  function showExpiring() {
    onFilter("expiring");
  }
  return (
    <Box className="mb-[22px] grid grid-cols-[repeat(auto-fit,minmax(min(100%,168px),1fr))] gap-4">
      <StatCard
        label="Total SKUs"
        value={String(snapshot.totalSkus)}
        hint={`${snapshot.totalUnits.toLocaleString("en-IN")} units in stock`}
        tone="green"
        icon={<IconInventory size={18} />}
        title="All products"
        onOpen={showAll}
      />
      <StatCard
        label="Stock value (cost)"
        value={inr(snapshot.totalValue)}
        hint={`≈ ${snapshot.potentialMargin}% margin`}
        tone="blue"
        icon={<IconCash size={18} />}
      />
      <StatCard
        label="Retail value (MRP)"
        value={inr(snapshot.retailValue)}
        hint="potential revenue"
        tone="green"
        icon={<IconTag size={18} />}
      />
      <StatCard
        label="Low on stock"
        value={String(snapshot.lowCount)}
        hint={`${snapshot.outCount} out of stock`}
        tone="gold"
        icon={<IconTrendDown size={18} />}
        title="Low & out of stock"
        onOpen={showLow}
      />
      <StatCard
        label="Expiring ≤ 4 mo"
        value={String(snapshot.expiringCount)}
        hint={`${inr(snapshot.expiringValue)} at risk`}
        tone="rose"
        icon={<IconCalendar size={18} />}
        title="Expiring soon"
        onOpen={showExpiring}
      />
      <StatCard
        label="Dead stock (90d)"
        value={String(snapshot.deadCount)}
        hint={`${inr(snapshot.deadValue)} tied up`}
        tone="gold"
        icon={<IconClock size={18} />}
      />
    </Box>
  );
}

function StatCard({
  label,
  value,
  hint,
  tone,
  icon,
  title,
  onOpen,
}: {
  label: string;
  value: string;
  hint: string;
  tone: "green" | "blue" | "gold" | "rose";
  icon: ReactNode;
  title?: string;
  onOpen?: () => void;
}) {
  function open() {
    onOpen?.();
  }
  function onKey(event: KeyboardEvent<HTMLDivElement>) {
    if (!onOpen) return;
    if (event.key !== "Enter" && event.key !== " ") return;
    event.preventDefault();
    onOpen();
  }
  const toneClass = {
    green: "bg-wash text-mid",
    blue: "bg-blue-bg text-blue",
    gold: "bg-amber-bg text-gold-d",
    rose: "bg-rose-bg text-rose",
  }[tone];
  return (
    <Box
      role={onOpen ? "button" : undefined}
      tabIndex={onOpen ? 0 : undefined}
      title={title}
      onClick={onOpen ? open : undefined}
      onKeyDown={onOpen ? onKey : undefined}
      className={cn(
        "group relative flex flex-col overflow-hidden rounded-md border border-line bg-paper px-[18px] py-4 shadow-sm",
        onOpen &&
          "cursor-pointer transition duration-[140ms] ease-out hover:-translate-y-0.5 hover:border-line-2 hover:shadow-card focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-mid",
      )}
    >
      {onOpen ? (
        <Box className="absolute top-[15px] right-[15px] -translate-x-[3px] text-faint opacity-0 transition duration-[140ms] ease-out group-hover:translate-x-0 group-hover:opacity-100 group-focus-visible:translate-x-0 group-focus-visible:opacity-100">
          <IconArrowRight size={16} />
        </Box>
      ) : null}
      <Box className={cn("grid h-8 w-8 place-items-center rounded-[9px]", toneClass)}>{icon}</Box>
      <Text variant="label" className="mt-3 text-[11px] tracking-[0.05em] text-muted uppercase">
        {label}
      </Text>
      <Text className="mt-[3px] mb-2.5 font-display text-[26px] font-extrabold tracking-[-0.03em] text-dark tabular-nums">
        {value}
      </Text>
      <Text className="mt-auto border-t border-line pt-[9px] text-[12px] [line-height:18px] text-muted">
        {hint}
      </Text>
    </Box>
  );
}
