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
  GST_RATES,
  PAYMENT_MODES,
  canSaveExpense,
  expenseTax,
  inr,
  type ExpenseDraft,
  type PaymentMode,
} from "../../model";

const selectClass =
  "w-full rounded-sm border border-line-2 bg-paper px-3 py-[9px] text-[13.5px] text-ink outline-none focus:border-mid focus:shadow-focus";

export function ExpenseDialog({
  today,
  categories,
  saving,
  error,
  onClose,
  onSave,
}: {
  today: string;
  categories: string[];
  saving: boolean;
  error: string | null;
  onClose: () => void;
  onSave: (draft: ExpenseDraft) => void;
}) {
  const [draft, setDraft] = useState<ExpenseDraft>({
    spentOn: today,
    party: "",
    category: categories[0] ?? "Miscellaneous",
    customCategory: "",
    paymentMode: "cash",
    amount: "",
    gst: 0,
    note: "",
  });
  const tax = expenseTax(draft.amount || "0", draft.gst);
  const showTax = draft.gst > 0 && Number(draft.amount) > 0;

  return (
    <Box
      className="fixed inset-0 z-[100] flex items-center justify-center bg-[rgba(13,32,21,0.5)] p-6 backdrop-blur-[3px] max-[767px]:items-end max-[767px]:p-0"
      onClick={onClose}
    >
      <Box
        role="dialog"
        aria-label="Create Expense"
        onClick={(event) => event.stopPropagation()}
        className="flex max-h-[90vh] w-full max-w-[480px] flex-col overflow-hidden rounded-lg bg-paper shadow-pop max-[767px]:max-h-[92dvh] max-[767px]:max-w-none max-[767px]:rounded-t-2xl max-[767px]:rounded-b-none"
      >
        <Stack
          direction="row"
          align="center"
          justify="between"
          className="border-b border-line px-5 py-4"
        >
          <Heading level={3}>Create Expense</Heading>
          <Button type="button" variant="ghost" size="sm" aria-label="Close" onClick={onClose}>
            <IconX size={16} />
          </Button>
        </Stack>
        <Box className="grid gap-[13px] overflow-y-auto p-5">
          <Box className="grid grid-cols-[1.5fr_1fr] gap-4 max-[767px]:grid-cols-1">
            <Stack className="gap-1.5">
              <Label htmlFor="expense-date">Date</Label>
              <Input
                id="expense-date"
                type="date"
                max={today}
                value={draft.spentOn}
                onChange={(event: ChangeEvent<HTMLInputElement>) =>
                  setDraft({ ...draft, spentOn: event.target.value })
                }
              />
            </Stack>
            <Stack className="gap-1.5">
              <Label htmlFor="expense-party">Paid to (party)</Label>
              <Input
                id="expense-party"
                value={draft.party}
                placeholder="Landlord, staff, vendor…"
                onChange={(event: ChangeEvent<HTMLInputElement>) =>
                  setDraft({ ...draft, party: event.target.value })
                }
              />
            </Stack>
          </Box>
          <Box className="grid grid-cols-[1.5fr_1fr] gap-4 max-[767px]:grid-cols-1">
            <Stack className="gap-1.5">
              <Label htmlFor="expense-category">Category</Label>
              <select
                id="expense-category"
                className={selectClass}
                value={draft.category}
                onChange={(event) => setDraft({ ...draft, category: event.target.value })}
              >
                {categories.map((category) => (
                  <option key={category} value={category}>
                    {category}
                  </option>
                ))}
              </select>
              <Input
                aria-label="Or a new category"
                value={draft.customCategory}
                placeholder="Or a new category"
                className="mt-1.5"
                onChange={(event: ChangeEvent<HTMLInputElement>) =>
                  setDraft({ ...draft, customCategory: event.target.value })
                }
              />
            </Stack>
            <Stack className="gap-1.5">
              <Label htmlFor="expense-mode">Payment mode</Label>
              <select
                id="expense-mode"
                className={selectClass}
                value={draft.paymentMode}
                onChange={(event) =>
                  setDraft({ ...draft, paymentMode: event.target.value as PaymentMode })
                }
              >
                {PAYMENT_MODES.map((mode) => (
                  <option key={mode.value} value={mode.value}>
                    {mode.label}
                  </option>
                ))}
              </select>
            </Stack>
          </Box>
          <Box className="grid grid-cols-[1.5fr_1fr] gap-4 max-[767px]:grid-cols-1">
            <Stack className="gap-1.5">
              <Label htmlFor="expense-amount">Amount ₹ (incl. GST)</Label>
              <Input
                id="expense-amount"
                inputMode="decimal"
                value={draft.amount}
                placeholder="0"
                onChange={(event: ChangeEvent<HTMLInputElement>) =>
                  setDraft({ ...draft, amount: event.target.value })
                }
              />
            </Stack>
            <Stack className="gap-1.5">
              <Label htmlFor="expense-gst">GST %</Label>
              <select
                id="expense-gst"
                className={selectClass}
                value={draft.gst}
                onChange={(event) => setDraft({ ...draft, gst: Number(event.target.value) })}
              >
                {GST_RATES.map((rate) => (
                  <option key={rate} value={rate}>
                    {rate}%
                  </option>
                ))}
              </select>
            </Stack>
          </Box>
          <Stack className="gap-1.5">
            <Label htmlFor="expense-note">Note (optional)</Label>
            <Input
              id="expense-note"
              value={draft.note}
              placeholder="What was this for?"
              onChange={(event: ChangeEvent<HTMLInputElement>) =>
                setDraft({ ...draft, note: event.target.value })
              }
            />
          </Stack>
          {showTax ? (
            <Text className="text-[12px] text-muted">
              Taxable {inr(tax.taxable)} · GST {inr(tax.tax)} (input credit)
            </Text>
          ) : null}
          {error ? <Text className="text-[13px] text-rose">{error}</Text> : null}
        </Box>
        <Stack direction="row" justify="end" className="gap-2.5 border-t border-line px-5 py-3.5">
          <Button type="button" variant="secondary" onClick={onClose}>
            Cancel
          </Button>
          <Button
            type="button"
            disabled={saving || !canSaveExpense(draft)}
            onClick={() => onSave(draft)}
          >
            Save expense
          </Button>
        </Stack>
      </Box>
    </Box>
  );
}
