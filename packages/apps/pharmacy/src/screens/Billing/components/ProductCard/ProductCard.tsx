import type { KeyboardEvent, MouseEvent } from "react";
import { Box } from "@/components/atoms/Box";
import { Button } from "@/components/atoms/Button";
import { Text } from "@/components/atoms/Text";
import { IconHash, IconPin } from "@/components/atoms/Icon";
import { ScheduleTag } from "@/components/molecules/ScheduleTag";
import { Thumb } from "@/components/Thumb";
import {
  billUnit,
  hasLocation,
  inr,
  inr2,
  isLowStock,
  looseSellable,
  stockLabel,
  stockOf,
  totalUnits,
  unitNoun,
} from "@/utils";
import { cn } from "@/utils/className";
import type { ProductCardProps } from "./ProductCard.types";

export function ProductCard({ product, packCount, looseCount, onAddPack, onAddLoose }: ProductCardProps) {
  const outOfStock = totalUnits(product) <= 0;
  const canSellLoose = looseSellable(product) && !outOfStock;
  const stockTone = outOfStock ? "text-rose" : isLowStock(product) ? "text-amber" : "text-green";
  const stockCopy = outOfStock
    ? "Out of stock"
    : isLowStock(product)
      ? `Low · ${stockLabel(product)}`
      : stockLabel(product);

  function addPack() {
    if (stockOf(product) > 0) onAddPack(product.id);
  }
  function addLoose(event: MouseEvent<HTMLButtonElement>) {
    event.stopPropagation();
    onAddLoose(product.id);
  }
  function onCardKey(event: KeyboardEvent<HTMLDivElement>) {
    if (event.key !== "Enter" && event.key !== " ") return;
    event.preventDefault();
    addPack();
  }

  return (
    <Box
      role="button"
      tabIndex={outOfStock ? -1 : 0}
      onClick={addPack}
      onKeyDown={onCardKey}
      className={cn(
        "relative flex cursor-pointer flex-col items-stretch rounded-md border border-line bg-paper p-3 text-left shadow-sm transition hover:border-mint hover:shadow-sm",
        outOfStock && "pointer-events-none opacity-55",
      )}
    >
      {packCount > 0 ? (
        <Box className="absolute top-2 right-2 grid h-5 min-w-5 place-items-center rounded-full bg-mid px-[5px] text-[11px] font-extrabold text-white">
          {packCount}
        </Box>
      ) : (
        <Box className="absolute top-[9px] right-[9px]">
          <ScheduleTag schedule={product.schedule} />
        </Box>
      )}
      <Box className="mb-[9px] grid h-10 w-10 place-items-center rounded-[10px] bg-wash text-[20px]">
        <Thumb p={product} />
      </Box>
      <Text as="span" className="min-h-[33px] text-[13px] leading-tight font-bold text-ink">
        {product.name}
      </Text>
      <Text as="span" className="mt-0.5 text-[11px] text-muted">
        {product.pack}
        {hasLocation(product) ? (
          <Text
            as="span"
            className="ml-1.5 inline-flex items-center gap-0.5 rounded-[5px] bg-wash px-[5px] py-px align-middle font-mono text-[10px] font-bold whitespace-nowrap text-mid"
          >
            <IconPin size={11} /> {product.rack}
          </Text>
        ) : null}
      </Text>
      <Text as="span" className="mt-2 font-display text-[14px] font-extrabold text-dark tabular-nums">
        {inr(billUnit(product).price)}
      </Text>
      <Text as="span" className={cn("mt-[3px] text-[10.5px] font-bold", stockTone)}>
        {stockCopy}
      </Text>
      <Box className="mt-[7px] flex h-6 items-center overflow-hidden">
        {canSellLoose ? (
          <Button
            variant="ghost"
            className={cn(
              "h-auto max-w-full justify-start gap-1 overflow-hidden rounded-[7px] border-mint bg-wash px-[7px] py-1 text-[10px] leading-tight font-bold text-ellipsis whitespace-nowrap text-mid hover:bg-mint hover:text-deep",
              looseCount > 0 && "border-mid bg-mid text-white hover:bg-mid hover:text-white",
            )}
            title={`Sell loose ${unitNoun(product)}s @ ${inr2(billUnit(product, { loose: true }).price)} each`}
            onClick={addLoose}
          >
            <IconHash size={13} /> Loose · {inr2(billUnit(product, { loose: true }).price)}/{unitNoun(product)}
            {looseCount > 0 ? ` · ${looseCount}` : ""}
          </Button>
        ) : null}
      </Box>
    </Box>
  );
}
