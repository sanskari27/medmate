import type { ChangeEvent, MouseEvent } from "react";
import { Box } from "@/components/atoms/Box";
import { Select } from "@/components/atoms/Select";
import { Stack } from "@/components/atoms/Stack";
import { Tag } from "@/components/atoms/Tag";
import { Text } from "@/components/atoms/Text";
import { QuantityStepper } from "@/components/molecules/QuantityStepper";
import { IconPin } from "@/components/atoms/Icon";
import { earliestBatch, hasLocation, inr, inr2, unitNoun, type Batch } from "@/utils";
import type { CartLineProps } from "./CartLine.types";

export function CartLine({ line, view, onDecrease, onIncrease, onQuantity, onRemove, onBatch }: CartLineProps) {
  const { product, loose, pinned, unit, maxQty } = view;

  function decrease() {
    onDecrease(product.id, loose, line.batchNo);
  }
  function increase() {
    onIncrease(product.id, loose, line.batchNo);
  }
  function setQuantity(quantity: number) {
    onQuantity(product.id, quantity, loose, line.batchNo);
  }
  function remove() {
    onRemove(product.id, loose, line.batchNo);
  }
  function keepClick(event: MouseEvent<HTMLSelectElement>) {
    event.stopPropagation();
  }
  function changeBatch(event: ChangeEvent<HTMLSelectElement>) {
    onBatch(product.id, event.target.value || undefined, loose);
  }

  const batches = product.batches.filter(function inStock(batch) {
    return batch.qty > 0 || batch.batchNo === line.batchNo;
  });

  return (
    <Stack direction="row" align="center" gap={2} className="border-b border-line py-2.5 last:border-0">
      <Box className="min-w-0 flex-1 overflow-hidden">
        <Text as="span" className="text-[13px] leading-tight font-bold text-ink">
          {product.name}{" "}
          {hasLocation(product) ? (
            <Text
              as="span"
              className="ml-1.5 inline-flex items-center gap-0.5 rounded-[5px] bg-wash px-[5px] py-px align-middle font-mono text-[10px] font-bold whitespace-nowrap text-mid"
            >
              <IconPin size={11} /> {product.rack}
            </Text>
          ) : null}
          {loose ? <Tag className="ml-0.5">loose</Tag> : null}
          {pinned ? <Tag className="ml-0.5 border-mint bg-wash text-mid">scanned</Tag> : null}
        </Text>
        <Text variant="caption" className="text-[11px]">
          {loose ? (
            <>
              {inr2(unit)}/{unitNoun(product)} · {product.gst}% GST ·{" "}
            </>
          ) : (
            <>
              {inr(unit)} · {product.gst}% GST ·{" "}
            </>
          )}
          <BatchSelect
            value={line.batchNo ?? ""}
            autoLabel={
              loose
                ? "From batch: auto (FEFO)"
                : `Batch: auto (FEFO ${earliestBatch(product)?.batchNo ?? "—"})`
            }
            batches={batches}
            quantityLabel={loose ? "strips" : "left"}
            onClick={keepClick}
            onChange={changeBatch}
          />
        </Text>
      </Box>
      <QuantityStepper qty={line.qty} max={maxQty} onDec={decrease} onInc={increase} onSet={setQuantity} onRemove={remove} />
      <Text as="span" className="min-w-16 shrink-0 text-right font-display text-[13.5px] font-extrabold text-dark">
        {inr(unit * line.qty)}
      </Text>
    </Stack>
  );
}

function BatchSelect({
  value,
  autoLabel,
  batches,
  quantityLabel,
  onClick,
  onChange,
}: {
  value: string;
  autoLabel: string;
  batches: Batch[];
  quantityLabel: string;
  onClick: (event: MouseEvent<HTMLSelectElement>) => void;
  onChange: (event: ChangeEvent<HTMLSelectElement>) => void;
}) {
  function renderBatch(batch: Batch) {
    return { value: String(batch.batchNo), label: "Batch " + String(batch.batchNo) + " \u00b7 exp " + String(batch.expiry) + " \u00b7 " + String(batch.qty) + " " + String(quantityLabel) };
  }
  return (
    <Select
      controlSize="sm"
      className="mt-[3px] h-auto w-auto max-w-full rounded-xs border-line-2 bg-wash-2 px-1 py-px font-mono text-[10.5px] text-mid"
      value={value}
      onClick={onClick}
      onChange={onChange}
     options={[{ value: "", label: String(autoLabel) }, ...batches.map(renderBatch)]} />
  );
}
