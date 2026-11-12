import type { ChangeEvent } from "react";
import { useState } from "react";
import { Box } from "@/components/ui/Box";
import { Button } from "@/components/ui/Button";
import { Heading } from "@/components/ui/Heading";
import { IconX } from "@/components/ui/Icon";
import { Input } from "@/components/ui/Input";
import { Label } from "@/components/ui/Label";
import { Stack } from "@/components/ui/Stack";
import { Text } from "@/components/ui/Text";
import {
  blankDraft,
  draftFromOffer,
  draftIsValid,
  type Offer,
  type OfferDraft,
  type OfferProduct,
  type OfferScope,
  type OfferType,
} from "../../model";

const selectClass =
  "w-full rounded-sm border border-line-2 bg-paper px-3 py-[9px] text-[13.5px] text-ink outline-none focus:border-mid focus:shadow-focus";

export function OfferDialog({
  offer,
  products,
  saving,
  error,
  onClose,
  onSave,
}: {
  offer: Offer | null;
  products: OfferProduct[];
  saving: boolean;
  error: string | null;
  onClose: () => void;
  onSave: (draft: OfferDraft) => void;
}) {
  const [draft, setDraft] = useState<OfferDraft>(offer ? draftFromOffer(offer) : blankDraft());
  const title = offer ? "Edit offer" : "Create offer";
  const valid = draftIsValid(draft);
  const choices = products.map((product) => ({ value: product.productId, label: product.name }));
  if (draft.target && !choices.some((choice) => choice.value === draft.target)) {
    choices.unshift({ value: draft.target, label: draft.target });
  }

  function patch(next: Partial<OfferDraft>) {
    setDraft((current) => ({ ...current, ...next }));
  }

  return (
    <Box
      className="fixed inset-0 z-[100] flex items-center justify-center bg-[rgba(13,32,21,0.5)] p-6 backdrop-blur-[3px] max-md:items-end max-md:p-0"
      onClick={onClose}
    >
      <Box
        role="dialog"
        aria-modal="true"
        aria-label={title}
        className="flex max-h-[90vh] w-full max-w-[540px] flex-col overflow-hidden rounded-lg bg-paper shadow-pop max-md:max-h-[92dvh] max-md:max-w-none max-md:rounded-t-2xl max-md:rounded-b-none"
        onClick={(event) => event.stopPropagation()}
      >
        <Stack
          direction="row"
          align="center"
          justify="between"
          className="border-b border-line px-5 py-4"
        >
          <Heading level={3} className="text-[17px]">
            {title}
          </Heading>
          <Button
            type="button"
            variant="ghost"
            aria-label="Close"
            className="grid h-8 w-8 place-items-center rounded-sm border-0 bg-wash-2 p-0 text-ink-2 shadow-none hover:bg-wash"
            onClick={onClose}
          >
            <IconX size={18} />
          </Button>
        </Stack>
        <Box className="overflow-y-auto p-5">
          <Box className="grid grid-cols-2 gap-3.5 max-md:grid-cols-1">
            <Box className="col-span-2 flex flex-col gap-1.5 max-md:col-span-1">
              <Label>Offer title</Label>
              <Input
                value={draft.title}
                placeholder="Monsoon Health Sale"
                onChange={(event) => patch({ title: event.target.value })}
              />
            </Box>
            <Box className="flex flex-col gap-1.5">
              <Label>Coupon code</Label>
              <Input
                value={draft.code}
                placeholder="NAMMA25"
                className="font-mono"
                onChange={(event) => patch({ code: event.target.value.toUpperCase() })}
              />
            </Box>
            <Box className="flex flex-col gap-1.5">
              <Label>Discount type</Label>
              <select
                className={selectClass}
                value={draft.type}
                aria-label="Discount type"
                onChange={(event: ChangeEvent<HTMLSelectElement>) =>
                  patch({ type: event.target.value as OfferType })
                }
              >
                <option value="pct">Percentage %</option>
                <option value="flat">Flat ₹</option>
              </select>
            </Box>
            <Box className="flex flex-col gap-1.5">
              <Label>{draft.type === "pct" ? "Percent off" : "Amount off (₹)"}</Label>
              <Input
                type="number"
                value={draft.value}
                onChange={(event) => patch({ value: event.target.value })}
              />
            </Box>
            <Box className="flex flex-col gap-1.5">
              <Label>Applies to</Label>
              <select
                className={selectClass}
                value={draft.scope}
                aria-label="Applies to"
                onChange={(event: ChangeEvent<HTMLSelectElement>) =>
                  patch({ scope: event.target.value as OfferScope, target: "" })
                }
              >
                <option value="all">All products</option>
                <option value="product">One product</option>
              </select>
            </Box>
            {draft.scope === "product" ? (
              <Box className="col-span-2 flex flex-col gap-1.5 max-md:col-span-1">
                <Label>Product</Label>
                <select
                  className={selectClass}
                  value={draft.target}
                  aria-label="Product"
                  onChange={(event: ChangeEvent<HTMLSelectElement>) =>
                    patch({ target: event.target.value })
                  }
                >
                  <option value="">Select…</option>
                  {choices.map((choice) => (
                    <option key={choice.value} value={choice.value}>
                      {choice.label}
                    </option>
                  ))}
                </select>
              </Box>
            ) : null}
          </Box>
          {error ? <Text className="mt-3 text-[12.5px] font-bold text-rose">{error}</Text> : null}
        </Box>
        <Stack
          direction="row"
          justify="end"
          className="mt-auto gap-2.5 border-t border-line px-5 py-3.5"
        >
          <Button type="button" variant="ghost" onClick={onClose}>
            Cancel
          </Button>
          <Button type="button" disabled={!valid || saving} onClick={() => onSave(draft)}>
            {offer ? "Save offer" : "Launch offer"}
          </Button>
        </Stack>
      </Box>
    </Box>
  );
}
