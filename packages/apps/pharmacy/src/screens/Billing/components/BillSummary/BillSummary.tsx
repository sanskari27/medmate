import type { ChangeEvent } from "react";
import { Box } from "@/components/atoms/Box";
import { Button } from "@/components/atoms/Button";
import { Input } from "@/components/atoms/Input";
import { Stack } from "@/components/atoms/Stack";
import { Text } from "@/components/atoms/Text";
import { inr } from "@/utils";
import { cn } from "@/utils/className";
import type { BillSummaryProps } from "./BillSummary.types";

export function BillSummary({
  gross,
  taxable,
  totalTax,
  payable,
  discount,
  discountMode,
  discountAmount,
  onDiscount,
  onDiscountMode,
}: BillSummaryProps) {
  function changeDiscount(event: ChangeEvent<HTMLInputElement>) {
    onDiscount(Math.max(0, Number(event.target.value) || 0));
  }
  function selectFlat() {
    onDiscountMode("flat");
  }
  function selectPercent() {
    onDiscountMode("percent");
  }

  return (
    <>
      <Box className="bg-wash-2 px-4 pt-[11px] pb-[9px]">
        <SummaryRow label="Subtotal (incl. GST)" value={inr(gross)} />
        <Stack
          direction="row"
          align="center"
          justify="between"
          className="py-[2.5px] text-[13px] text-ink-2"
        >
          <Text as="span" className="text-[13px] text-ink-2">
            Discount
            {discountMode === "percent" && discountAmount > 0 ? ` · −${inr(discountAmount)}` : ""}
          </Text>
          <Stack direction="row" align="center" gap={1}>
            <Input
              type="number"
              min={0}
              value={discount || ""}
              placeholder="0"
              onChange={changeDiscount}
              className="w-[60px] px-2 py-[5px] text-right"
            />
            <Box className="inline-flex gap-0.5 rounded-sm border border-line bg-wash-2 p-0.5">
              <Button
                variant="ghost"
                size="sm"
                className={cn(
                  "h-auto border-0 px-[9px] py-1 text-[12.5px] shadow-none hover:bg-transparent",
                  discountMode === "flat"
                    ? "bg-paper text-dark shadow-sm hover:bg-paper hover:text-dark"
                    : "bg-transparent text-muted",
                )}
                onClick={selectFlat}
              >
                ₹
              </Button>
              <Button
                variant="ghost"
                size="sm"
                className={cn(
                  "h-auto border-0 px-[9px] py-1 text-[12.5px] shadow-none hover:bg-transparent",
                  discountMode === "percent"
                    ? "bg-paper text-dark shadow-sm hover:bg-paper hover:text-dark"
                    : "bg-transparent text-muted",
                )}
                onClick={selectPercent}
              >
                %
              </Button>
            </Box>
          </Stack>
        </Stack>
        <SummaryRow label="Taxable value" value={inr(taxable)} />
        <SummaryRow label="CGST + SGST" value={inr(totalTax)} />
      </Box>
      <Stack
        direction="row"
        align="center"
        justify="between"
        className="border-b border-line bg-gradient-to-r from-wash to-wash-2 px-4 py-[11px]"
      >
        <Text as="span" className="text-[13px] font-bold text-ink-2">
          To pay
        </Text>
        <Text
          as="span"
          className="font-display text-[23px] font-extrabold tracking-[-0.02em] text-dark"
        >
          {inr(payable)}
        </Text>
      </Stack>
    </>
  );
}

function SummaryRow({ label, value }: { label: string; value: string }) {
  return (
    <Stack direction="row" justify="between" className="py-[2.5px]">
      <Text as="span" className="text-[13px] text-ink-2">
        {label}
      </Text>
      <Text as="span" className="text-[13px] text-ink-2">
        {value}
      </Text>
    </Stack>
  );
}
