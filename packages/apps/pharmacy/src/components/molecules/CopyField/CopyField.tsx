import { cva } from "class-variance-authority";
import { useState, type ComponentProps } from "react";
import { IconButton } from "@/components/atoms/IconButton";
import { IconCheck, IconCopy } from "@/components/atoms/Icon";
import { MonoText } from "@/components/atoms/MonoText";
import { Stack } from "@/components/atoms/Stack";
import { Text } from "@/components/atoms/Text";
import { cn } from "@/utils/className";

const copyFieldVariants = cva(
  "relative gap-0.5 rounded-[11px] border border-line bg-wash-2 px-[13px] py-[11px] pr-10",
);

export type CopyFieldProps = Omit<ComponentProps<typeof Stack>, "children"> & {
  label: string;
  value: string;
};

export function CopyField({ className, label, value, ...props }: CopyFieldProps) {
  const [copied, setCopied] = useState(false);

  function copyValue() {
    function finish() {
      setCopied(true);
      window.setTimeout(function resetCopied() {
        setCopied(false);
      }, 1400);
    }
    const clipboard = navigator.clipboard;
    if (!clipboard) {
      finish();
      return;
    }
    void clipboard.writeText(value).then(finish, finish);
  }

  return (
    <Stack data-slot="copy-field" className={cn(copyFieldVariants(), className)} {...props}>
      <Text
        as="span"
        variant="label"
        className="text-[10px] font-extrabold tracking-[0.05em] text-muted uppercase"
      >
        {label}
      </Text>
      <MonoText className="text-[15px] font-bold">{value}</MonoText>
      <IconButton
        label={copied ? `Copied ${label}` : `Copy ${label}`}
        onClick={copyValue}
        className="absolute top-[9px] right-[9px] h-[26px] w-[26px] rounded-[7px] border-line"
      >
        {copied ? <IconCheck size={13} /> : <IconCopy size={13} />}
      </IconButton>
    </Stack>
  );
}

export { copyFieldVariants };
