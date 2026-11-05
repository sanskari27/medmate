import { Box } from "@/components/atoms/Box";
import { Button } from "@/components/atoms/Button";
import { Heading } from "@/components/atoms/Heading";
import { Stack } from "@/components/atoms/Stack";
import { Text } from "@/components/atoms/Text";
import { IconAlert, IconArrowRight, IconReceipt, IconX } from "@/components/atoms/Icon";
import { inr } from "@/utils";
import type { PosLine } from "@/store/slices/billing/billingSlice";
import { billingLineKey, type BillingLineView } from "../../Billing.utils";
import { CartLine } from "../CartLine";
import type { CartPanelProps } from "./CartPanel.types";

type CartEntry = { line: PosLine; view: BillingLineView };

export function CartPanel({
  count,
  itemCount,
  payable,
  canProceed,
  prescriptionReady,
  onClear,
  onProceed,
  lines,
  onDecrease,
  onIncrease,
  onQuantity,
  onRemove,
  onBatch,
  customer,
  source,
}: CartPanelProps) {
  function renderLine(entry: CartEntry) {
    return (
      <CartLine
        key={billingLineKey(entry.line)}
        line={entry.line}
        view={entry.view}
        onDecrease={onDecrease}
        onIncrease={onIncrease}
        onQuantity={onQuantity}
        onRemove={onRemove}
        onBatch={onBatch}
      />
    );
  }

  return (
    <Stack className="sticky top-0 max-h-[calc(100vh-124px)] overflow-hidden rounded-lg border border-line bg-paper shadow-card max-[1180px]:static max-[1180px]:max-h-none">
      <Stack direction="row" align="center" justify="between" className="border-b border-line px-4 py-[15px]">
        <Heading level={3} className="flex items-center text-[15px] font-bold">
          Current bill
          {count > 0 ? (
            <Text
              as="span"
              className="ml-2 inline-grid h-5 min-w-5 place-items-center rounded-full bg-mid px-1.5 font-display text-[12px] font-extrabold text-white"
            >
              {count}
            </Text>
          ) : null}
        </Heading>
        {itemCount > 0 ? (
          <Button variant="ghost" size="sm" onClick={onClear}>
            <IconX size={13} /> Clear
          </Button>
        ) : null}
      </Stack>
      <Box className="min-h-[120px] flex-1 overflow-y-auto px-4 py-1.5">
        {itemCount === 0 ? (
          <Stack align="center" className="px-3 py-[34px] text-center">
            <Box className="mb-3 grid h-11 w-11 place-items-center rounded-md bg-wash text-mid">
              <IconReceipt size={28} />
            </Box>
            <Text variant="muted" className="text-[13px]">
              Scan or tap a medicine to start billing.
            </Text>
          </Stack>
        ) : (
          lines.map(renderLine)
        )}
      </Box>
      <Box className="border-t border-line">
        {customer}
        {source}
        <Box className="px-4 pt-3 pb-4">
          <Stack direction="row" align="center" justify="between" className="pt-0.5 pb-3">
            <Text as="span" className="text-[13px] font-bold text-ink-2">
              Items total (incl. GST)
            </Text>
            <Text as="span" className="font-display text-[23px] font-extrabold tracking-tight text-dark">
              {inr(payable)}
            </Text>
          </Stack>
          <Button variant="primary" size="lg" block disabled={itemCount === 0 || !canProceed} onClick={onProceed}>
            Proceed to bill <IconArrowRight size={16} />
          </Button>
          {itemCount > 0 && !canProceed ? (
            <Text as="span" className="mt-2 flex items-center justify-center gap-[5px] text-[11px] font-semibold text-rose">
              <IconAlert size={12} />{" "}
              {prescriptionReady ? "Select the ward to continue" : "Enter the prescribing doctor to continue"}
            </Text>
          ) : null}
        </Box>
      </Box>
    </Stack>
  );
}
