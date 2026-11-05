import { useState } from "react";
import { IconButton } from "@/components/atoms";
import { IconCheck, IconCopy } from "@/components/atoms";
import { copyText } from "./CopyButton.utils";
import type { CopyButtonProps } from "./CopyButton.types";

export function CopyButton({ text, label }: CopyButtonProps) {
  const [copied, setCopied] = useState(false);
  const accessibleLabel = `Copy ${label || "text"}`;

  function handleCopy() {
    copyText(text, function markCopied() {
      setCopied(true);
      window.setTimeout(function clearCopied() {
        setCopied(false);
      }, 1400);
    });
  }

  return (
    <IconButton label={accessibleLabel} variant="ghost" className="h-[26px] w-[26px] rounded-[7px] border border-line bg-paper text-ink-2" onClick={handleCopy}>
      {copied ? <IconCheck size={13} /> : <IconCopy size={13} />}
    </IconButton>
  );
}
