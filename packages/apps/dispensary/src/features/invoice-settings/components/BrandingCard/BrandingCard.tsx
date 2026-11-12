import { useEffect, useRef, useState, type ChangeEvent } from "react";
import { Box } from "@/components/ui/Box";
import { Button } from "@/components/ui/Button";
import { Text } from "@/components/ui/Text";
import type { InvoiceDraft, InvoiceFile } from "../../model";
import { ToggleRow } from "../ToggleRow";

const cardClass = "flex flex-col rounded-md border border-line bg-paper p-[18px] shadow-sm";
const headingClass =
  "mb-2.5 border-b border-line pb-[7px] font-display text-[13.5px] font-extrabold text-mid";
const IMAGE_ACCEPT = "image/jpeg,image/png,image/webp";

export function BrandingCard({
  draft,
  logo,
  signature,
  disabled = false,
  onChange,
}: {
  draft: InvoiceDraft;
  logo: InvoiceFile | null;
  signature: InvoiceFile | null;
  disabled?: boolean;
  onChange: (patch: Partial<InvoiceDraft>) => void;
}) {
  return (
    <Box className={cardClass}>
      <Text className={headingClass}>Branding</Text>
      <Box className="grid grid-cols-2 gap-3.5 max-[767px]:grid-cols-1">
        <Box className="flex flex-col gap-2">
          <ImageSlot
            label="Brand logo"
            inputLabel="Brand logo"
            file={draft.logoFile}
            stored={logo}
            action={draft.logoFile || logo ? "Change" : "Upload"}
            disabled={disabled}
            onFile={(logoFile) => onChange({ logoFile })}
          />
          <ToggleRow
            label="Show logo on invoice"
            on={draft.showLogo}
            disabled={disabled}
            onClick={() => onChange({ showLogo: !draft.showLogo })}
          />
        </Box>
        <Box className="flex flex-col gap-2">
          <ImageSlot
            label="Signature / seal stamp"
            inputLabel="Signature / seal stamp"
            file={draft.signatureFile}
            stored={signature}
            action={draft.signatureFile || signature ? "Change" : "Upload"}
            disabled={disabled}
            onFile={(signatureFile) => onChange({ signatureFile })}
          />
          <ToggleRow
            label="Show stamp on invoice"
            on={draft.showStamp}
            disabled={disabled}
            onClick={() => onChange({ showStamp: !draft.showStamp })}
          />
        </Box>
      </Box>
    </Box>
  );
}

function ImageSlot({
  label,
  inputLabel,
  file,
  stored,
  action,
  disabled = false,
  onFile,
}: {
  label: string;
  inputLabel: string;
  file?: File;
  stored: InvoiceFile | null;
  action: "Upload" | "Change";
  disabled?: boolean;
  onFile: (file: File) => void;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const preview = useObjectUrl(file);
  const src = preview ?? stored?.url;
  return (
    <Box className="flex flex-col gap-2">
      <Text className="text-[12px] font-bold text-ink-2">{label}</Text>
      <Box className="grid h-[78px] place-items-center overflow-hidden rounded-[10px] border border-dashed border-line-2 bg-wash-2">
        {src ? (
          <img src={src} alt="" className="max-h-[70px] max-w-full object-contain" />
        ) : (
          <Text as="span" className="text-muted">
            {label}
          </Text>
        )}
      </Box>
      <input
        ref={inputRef}
        aria-label={inputLabel}
        type="file"
        accept={IMAGE_ACCEPT}
        disabled={disabled}
        className="sr-only"
        onChange={(event: ChangeEvent<HTMLInputElement>) => {
          const picked = event.target.files?.[0];
          event.target.value = "";
          if (picked) onFile(picked);
        }}
      />
      <Button
        type="button"
        variant="ghost"
        size="sm"
        disabled={disabled}
        onClick={() => inputRef.current?.click()}
      >
        {action}
      </Button>
    </Box>
  );
}

function useObjectUrl(file?: File) {
  const [url, setUrl] = useState<string>();
  useEffect(() => {
    if (!file || typeof URL.createObjectURL !== "function") {
      setUrl(undefined);
      return;
    }
    const next = URL.createObjectURL(file);
    setUrl(next);
    return () => URL.revokeObjectURL(next);
  }, [file]);
  return url;
}
