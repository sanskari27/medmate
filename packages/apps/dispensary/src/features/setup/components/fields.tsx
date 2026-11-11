import { useEffect, useRef, useState, type ChangeEvent, type ReactNode } from "react";
import { Box } from "@/components/ui/Box";
import { Button } from "@/components/ui/Button";
import { Field } from "@/components/ui/Field";
import { Stack } from "@/components/ui/Stack";
import { Text } from "@/components/ui/Text";
import { cn } from "@/utils/className";
import { hasDocument } from "../draft";
import type { DocumentSlot, SetupDraft } from "../types";
import { IconUpload } from "./icons";

export function SelectField({
  label,
  value,
  options,
  onChange,
}: {
  label: string;
  value: string;
  options: readonly { value: string; label: string }[];
  onChange: (value: string) => void;
}) {
  return (
    <Field label={label}>
      <Box className="relative">
        <select
          value={value}
          onChange={(event) => onChange(event.target.value)}
          className="w-full appearance-none rounded-sm border border-line-2 bg-paper px-3 py-[9px] pr-9 text-[13.5px] text-ink outline-none"
        >
          {options.map((option) => (
            <option key={option.value || "empty"} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
        <Box className="pointer-events-none absolute top-1/2 right-3 -translate-y-1/2 text-muted">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" aria-hidden>
            <path
              d="m6 9 6 6 6-6"
              stroke="currentColor"
              strokeWidth="1.8"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </Box>
      </Box>
    </Field>
  );
}

export function LogoPicker({
  file,
  stored,
  onFile,
}: {
  file?: File;
  stored: boolean;
  onFile: (file: File) => void;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [preview, setPreview] = useState<string | null>(null);
  useEffect(() => {
    if (!file) {
      setPreview(null);
      return;
    }
    const url = URL.createObjectURL(file);
    setPreview(url);
    return () => URL.revokeObjectURL(url);
  }, [file]);
  function onPick(event: ChangeEvent<HTMLInputElement>) {
    const picked = event.target.files?.[0];
    event.target.value = "";
    if (picked) onFile(picked);
  }
  return (
    <Box className="shrink-0">
      <input
        ref={inputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        className="sr-only"
        onChange={onPick}
      />
      <button
        type="button"
        aria-label={stored || preview ? "Replace logo" : "Upload logo"}
        onClick={() => inputRef.current?.click()}
        className={cn(
          "grid h-[135px] w-[135px] place-items-center overflow-hidden rounded-[14px] border border-dashed border-line-2 p-0",
          preview ? "bg-ink" : "bg-wash-2",
        )}
      >
        {preview ? (
          <img src={preview} alt="" className="h-full w-full object-contain" />
        ) : (
          <Stack align="center" gap={1} className="text-muted">
            <IconUpload size={18} />
            <Text as="span" className="text-[11px]">
              {stored ? "Attached" : "Logo"}
            </Text>
          </Stack>
        )}
      </button>
    </Box>
  );
}

export function FileField({
  label,
  slot,
  draft,
  accept,
  onFile,
}: {
  label: string;
  slot: DocumentSlot;
  draft: SetupDraft;
  accept: string;
  onFile: (slot: DocumentSlot, file: File) => void;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const chosen = draft.files[slot];
  const attached = hasDocument(draft, slot);
  function onPick(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (file) onFile(slot, file);
  }
  function open() {
    inputRef.current?.click();
  }
  return (
    <Field label={label}>
      <input ref={inputRef} type="file" accept={accept} className="sr-only" onChange={onPick} />
      {attached ? (
        <Stack direction="row" align="center" gap={2}>
          <Text as="span" className="text-[12.5px] font-bold">
            {chosen ? chosen.name : "Attached"}
          </Text>
          <Button variant="ghost" size="sm" type="button" onClick={open} className="h-9.25">
            Replace
          </Button>
        </Stack>
      ) : (
        <Button variant="ghost" size="sm" type="button" onClick={open} className="h-9.25">
          <IconUpload size={14} /> Attach
        </Button>
      )}
    </Field>
  );
}

export function FeatureRow({
  icon,
  title,
  subtitle,
  checked,
  onToggle,
  locked,
}: {
  icon: ReactNode;
  title: string;
  subtitle: string;
  checked?: boolean;
  onToggle?: () => void;
  locked?: boolean;
}) {
  return (
    <Stack
      direction="row"
      align="center"
      className={cn(
        "mb-2.5 gap-3 rounded-md border border-line px-3.5 py-3",
        locked && "opacity-85",
      )}
    >
      <Box className="grid h-[38px] w-[38px] shrink-0 place-items-center rounded-[10px] bg-wash text-mid">
        {icon}
      </Box>
      <Stack gap={0} className="min-w-0 flex-1">
        <Text as="span" className="text-[13.5px] font-bold text-ink">
          {title}
        </Text>
        <Text as="span" className="text-xs text-muted">
          {subtitle}
        </Text>
      </Stack>
      {locked ? (
        <Text as="span" className="rounded-full bg-wash px-2 py-0.5 text-[11px] font-bold text-mid">
          On
        </Text>
      ) : (
        <button
          type="button"
          role="switch"
          aria-checked={checked}
          aria-label={title}
          onClick={onToggle}
          className={cn(
            "relative h-[22px] w-[38px] shrink-0 rounded-[11px] border-0 p-0 after:absolute after:top-0.5 after:left-0.5 after:h-[18px] after:w-[18px] after:rounded-full after:bg-paper after:shadow-[0_1px_3px_rgba(0,0,0,0.22)] after:transition after:content-['']",
            checked ? "bg-mid after:translate-x-4" : "bg-[#cddcd3]",
          )}
        />
      )}
    </Stack>
  );
}
