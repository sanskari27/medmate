import { useEffect, useRef, useState, type ChangeEvent } from "react";
import { Box } from "@/components/ui/Box";
import { Button } from "@/components/ui/Button";
import { Field } from "@/components/ui/Field";
import { Stack } from "@/components/ui/Stack";
import { Text } from "@/components/ui/Text";
import { cn } from "@/utils/className";

type DocumentFieldProps = {
  label: string;
  accept: string;
  file?: File;
  stored: boolean;
  contentType?: string;
  onFile: (file: File) => void;
  onRemove?: () => void;
  layout?: "row" | "logo" | "inline";
};

export function DocumentField({
  label,
  accept,
  file,
  stored,
  contentType,
  onFile,
  onRemove,
  layout = "row",
}: DocumentFieldProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const preview = usePreview(file);
  const attached = Boolean(file) || stored;
  const pdf = isPdf(file, contentType);
  function onPick(event: ChangeEvent<HTMLInputElement>) {
    const picked = event.target.files?.[0];
    event.target.value = "";
    if (picked) onFile(picked);
  }
  function open() {
    inputRef.current?.click();
  }
  const input = (
    <input ref={inputRef} type="file" accept={accept} className="sr-only" onChange={onPick} />
  );
  if (layout === "inline") {
    return (
      <Stack direction="row" align="center" gap={2} className="min-h-[38px]">
        {input}
        {attached ? (
          <>
            {preview ? (
              <img src={preview} alt="" className="h-9 max-w-[72px] object-contain" />
            ) : (
              <Text as="span" className="truncate text-[12.5px] font-bold">
                {pdf || stored ? "Attached" : file?.name}
              </Text>
            )}
            <Button type="button" variant="ghost" size="sm" onClick={open}>
              Replace
            </Button>
          </>
        ) : (
          <Button type="button" variant="ghost" size="sm" onClick={open}>
            Attach
          </Button>
        )}
      </Stack>
    );
  }
  if (layout === "logo") {
    return (
      <Box className="shrink-0">
        {input}
        <button
          type="button"
          aria-label={attached ? "Replace logo" : "Upload logo"}
          onClick={open}
          className={cn(
            "grid h-[92px] w-[92px] place-items-center overflow-hidden rounded-[14px] border border-dashed border-line-2 p-0",
            preview ? "bg-ink" : "bg-wash-2",
          )}
        >
          {preview ? (
            <img src={preview} alt="" className="h-full w-full object-contain" />
          ) : (
            <Text as="span" className="text-[11px] text-muted">
              {stored ? "Attached" : "Logo"}
            </Text>
          )}
        </button>
        {attached && onRemove ? (
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={onRemove}
            className="mt-1.5 w-[92px]"
          >
            Remove
          </Button>
        ) : null}
      </Box>
    );
  }
  return (
    <Field label={label}>
      {input}
      {attached ? (
        <Stack direction="row" align="center" gap={2}>
          {preview ? (
            <img src={preview} alt="" className="max-h-[90px] max-w-[220px] object-contain" />
          ) : (
            <Text as="span" className="text-[12.5px] font-bold">
              {pdf || stored ? "Attached" : file?.name}
            </Text>
          )}
          <Button type="button" variant="ghost" size="sm" onClick={open}>
            Replace
          </Button>
          {onRemove ? (
            <Button type="button" variant="ghost" size="sm" onClick={onRemove}>
              Remove
            </Button>
          ) : null}
        </Stack>
      ) : (
        <Button type="button" variant="ghost" size="sm" onClick={open}>
          Attach
        </Button>
      )}
    </Field>
  );
}

function usePreview(file?: File) {
  const [preview, setPreview] = useState<string | null>(null);
  useEffect(() => {
    if (!file || !file.type.startsWith("image/")) {
      setPreview(null);
      return;
    }
    const url = URL.createObjectURL(file);
    setPreview(url);
    return () => URL.revokeObjectURL(url);
  }, [file]);
  return preview;
}

function isPdf(file: File | undefined, contentType: string | undefined) {
  if (file) return file.type === "application/pdf";
  return contentType === "application/pdf";
}
