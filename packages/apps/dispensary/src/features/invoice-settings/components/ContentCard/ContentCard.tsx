import { Box } from "@/components/ui/Box";
import { Field } from "@/components/ui/Field";
import { Input } from "@/components/ui/Input";
import { Text } from "@/components/ui/Text";
import { cn } from "@/utils/className";
import { INVOICE_TITLES, type InvoiceDraft } from "../../model";
import { ToggleRow } from "../ToggleRow";

const cardClass = "flex flex-col rounded-md border border-line bg-paper p-[18px] shadow-sm";
const headingClass =
  "mb-2.5 border-b border-line pb-[7px] font-display text-[13.5px] font-extrabold text-mid";

export function ContentCard({
  draft,
  disabled = false,
  onChange,
}: {
  draft: InvoiceDraft;
  disabled?: boolean;
  onChange: (patch: Partial<InvoiceDraft>) => void;
}) {
  return (
    <Box className={cardClass}>
      <Text className={headingClass}>Content</Text>
      <Box className="grid grid-cols-2 gap-3.5 max-[767px]:grid-cols-1">
        <Field label="Document title" htmlFor="invoice-title">
          <Input
            id="invoice-title"
            list="invoice-titles"
            disabled={disabled}
            value={draft.title}
            onChange={(event) => onChange({ title: event.target.value })}
          />
          <datalist id="invoice-titles">
            {INVOICE_TITLES.map((title) => (
              <option key={title} value={title} />
            ))}
          </datalist>
        </Field>
        <Field label="Invoice number prefix" htmlFor="invoice-prefix">
          <Input
            id="invoice-prefix"
            className="font-mono"
            disabled={disabled}
            value={draft.prefix}
            onChange={(event) => onChange({ prefix: event.target.value })}
          />
        </Field>
        <Field label="Signatory label" htmlFor="invoice-signatory">
          <Input
            id="invoice-signatory"
            disabled={disabled}
            value={draft.signatory}
            onChange={(event) => onChange({ signatory: event.target.value })}
          />
        </Field>
        <Field label="Bank details line" htmlFor="invoice-bank">
          <Input
            id="invoice-bank"
            disabled={disabled}
            value={draft.bankLine}
            onChange={(event) => onChange({ bankLine: event.target.value })}
          />
        </Field>
        <Field
          label="Terms & conditions"
          htmlFor="invoice-terms"
          className="col-span-2 max-[767px]:col-span-1"
        >
          <textarea
            id="invoice-terms"
            value={draft.terms}
            maxLength={4000}
            disabled={disabled}
            onChange={(event) => onChange({ terms: event.target.value })}
            className="min-h-16 w-full resize-y rounded-sm border border-line-2 bg-paper px-3 py-[9px] text-[13.5px] text-ink outline-none focus:border-mid focus:shadow-focus"
          />
        </Field>
      </Box>
      <Text className={cn(headingClass, "mt-5")}>Display options</Text>
      <ToggleRow
        label="Print bank details"
        on={draft.showBank}
        disabled={disabled}
        onClick={() => onChange({ showBank: !draft.showBank })}
      />
    </Box>
  );
}
