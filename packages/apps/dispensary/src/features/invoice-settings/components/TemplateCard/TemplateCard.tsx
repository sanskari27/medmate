import type { ChangeEvent } from "react";
import { Box } from "@/components/ui/Box";
import { Button } from "@/components/ui/Button";
import { IconCheck } from "@/components/ui/Icon";
import { Input } from "@/components/ui/Input";
import { Text } from "@/components/ui/Text";
import { cn } from "@/utils/className";
import {
  INVOICE_ACCENTS,
  INVOICE_TEMPLATES,
  type InvoiceDraft,
  type InvoiceTemplate,
} from "../../model";

const cardClass = "flex flex-col rounded-md border border-line bg-paper p-[18px] shadow-sm";
const headingClass =
  "mb-2.5 border-b border-line pb-[7px] font-display text-[13.5px] font-extrabold text-mid";

export function TemplateCard({
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
      <Text className={headingClass}>Invoice template</Text>
      <Box className="grid grid-cols-2 gap-2.5 max-[767px]:grid-cols-1">
        {INVOICE_TEMPLATES.map((template) => {
          const selected = draft.template === template.key;
          return (
            <Button
              key={template.key}
              type="button"
              aria-pressed={selected}
              disabled={disabled}
              onClick={() => onChange({ template: template.key })}
              className={cn(
                "flex h-auto w-full flex-col items-stretch justify-start gap-[3px] rounded-md border-[1.5px] border-line bg-paper p-2.5 text-left font-normal shadow-none hover:border-line-2 hover:bg-wash-2",
                selected &&
                  "border-mid shadow-[0_0_0_1px_var(--color-mid)] hover:border-mid hover:bg-paper",
              )}
            >
              <TemplateThumb kind={template.key} accent={draft.accent} />
              <Text
                as="span"
                className="flex w-full items-center justify-between gap-[5px] text-[13px] font-extrabold text-ink"
              >
                {template.name}
                {selected ? <IconCheck size={13} /> : null}
              </Text>
              <Text as="span" className="text-[11px] text-muted">
                {template.desc}
              </Text>
            </Button>
          );
        })}
      </Box>
      <Text className={cn(headingClass, "mt-5")}>Accent colour</Text>
      <Box className="flex flex-wrap items-center gap-1.5">
        {INVOICE_ACCENTS.map((accent) => {
          const selected = draft.accent.toLowerCase() === accent.toLowerCase();
          return (
            <Button
              key={accent}
              type="button"
              aria-label={accent}
              aria-pressed={selected}
              disabled={disabled}
              onClick={() => onChange({ accent })}
              className={cn(
                "relative grid h-[30px] w-[30px] place-items-center overflow-hidden rounded-sm border-2 border-white p-0 text-white shadow-[0_0_0_1px_var(--color-line-2)]",
                selected && "shadow-[0_0_0_2px_var(--color-ink)]",
              )}
              style={{ background: accent }}
            >
              {selected ? <IconCheck size={13} /> : null}
            </Button>
          );
        })}
        <label
          title="Custom colour"
          className="relative grid h-[30px] w-[30px] cursor-pointer overflow-hidden rounded-sm border-2 border-white bg-[conic-gradient(from_0deg,#f00,#ff0,#0f0,#0ff,#00f,#f0f,#f00)] shadow-[0_0_0_1px_var(--color-line-2)]"
        >
          <Input
            aria-label="Custom colour"
            className="absolute inset-[-4px] h-auto w-auto cursor-pointer border-0 bg-transparent p-0 opacity-0"
            type="color"
            disabled={disabled}
            value={toColorInput(draft.accent)}
            onChange={(event: ChangeEvent<HTMLInputElement>) =>
              onChange({ accent: event.target.value })
            }
          />
        </label>
      </Box>
    </Box>
  );
}

function toColorInput(accent: string) {
  return /^#[0-9A-Fa-f]{6}$/.test(accent) ? accent : "#1B3D29";
}

function TemplateThumb({ kind, accent }: { kind: InvoiceTemplate; accent: string }) {
  if (kind === "thermal") {
    return (
      <Box className="mb-[5px] h-[66px] w-full overflow-hidden rounded-sm border border-line bg-paper p-1.5">
        <Box className="mx-auto flex w-[54px] flex-col gap-[3px]">
          <Box className="mx-auto h-1 w-3/5 rounded-sm bg-[#e4e4e4]" />
          <Box className="mx-auto my-0.5 h-1 w-2/5 rounded-sm bg-[#e4e4e4]" />
          <Box className="h-1 w-full rounded-sm bg-[#e4e4e4]" />
          <Box className="h-1 w-full rounded-sm bg-[#e4e4e4]" />
          <Box className="h-1 w-full rounded-sm" style={{ background: accent }} />
        </Box>
      </Box>
    );
  }
  const band = kind === "modern";
  return (
    <Box className="mb-[5px] flex h-[66px] w-full flex-col overflow-hidden rounded-sm border border-line bg-paper p-1.5">
      <Box
        className={cn(
          "flex items-center gap-[5px]",
          band ? "-mx-1.5 -mt-1.5 mb-1 px-1.5 py-1.5" : "border-b-2 pb-1",
        )}
        style={
          band
            ? { background: accent }
            : { borderBottomColor: kind === "minimal" ? "#ddd" : accent }
        }
      >
        <Box
          className="h-3 w-3 shrink-0 rounded-[3px]"
          style={{ background: band ? "rgba(255,255,255,.75)" : accent }}
        />
        <Box className={cn("ml-auto h-1.5 w-9 rounded-sm", band ? "bg-white/70" : "bg-[#bbb]")} />
      </Box>
      <Box className="mt-[5px] flex flex-col gap-[3px]">
        <Box className="h-1 rounded-sm bg-[#ececec]" />
        <Box className="h-1 rounded-sm bg-[#ececec]" />
        <Box className="h-1 rounded-sm bg-[#ececec]" />
      </Box>
      <Box className="mt-auto ml-auto h-1.5 w-2/5 rounded-sm" style={{ background: accent }} />
    </Box>
  );
}
