import { useState } from "react";
import { waLink, smsLink, type StaffUser } from "@/utils";
import { Box, Button, Stack, Text } from "@/components/atoms";
import { IconAlert, IconCheck, IconCopy, IconMail, IconMessage, IconWhatsApp } from "@/components/atoms";
import { CodeBlock } from "@/components/atoms";
import { Modal } from "@/components/molecules/Modal";
import { CopyButton, copyText } from "@/screens/Users/components/CopyButton";
import { buildCredentialMessage } from "@/screens/Users/Users.utils";

import type { ShareCredsProps } from "./ShareCreds.types";


export function ShareCreds({ user, pharmacy, onClose }: ShareCredsProps) {
  const message = buildCredentialMessage(user, pharmacy);
  const [copied, setCopied] = useState(false);
  const mail = `mailto:${user.email || ""}?subject=${encodeURIComponent(`Your ${pharmacy} login`)}&body=${encodeURIComponent(message)}`;

  function handleCopyMessage() {
    copyText(message, function markCopied() {
      setCopied(true);
      window.setTimeout(function clearCopied() {
        setCopied(false);
      }, 1600);
    });
  }

  return (
    <Modal title={`Share login with ${user.name}`} onClose={onClose} footer={<Button variant="primary" onClick={onClose}>Done</Button>}>
      <Box className="mb-3.5 grid grid-cols-2 gap-2.5">
        <CredentialCard label="Login ID" value={user.username || ""} copyLabel="login ID" />
        <CredentialCard label="Password" value={user.password || ""} copyLabel="password" />
      </Box>
      <CodeBlock className="max-h-[220px] rounded-[11px]">{message}</CodeBlock>
      <Stack direction="row" wrap gap={2} className="mt-3">
        <Button variant="line" className="min-w-[120px] flex-1" onClick={handleCopyMessage}>
          {copied ? <IconCheck size={15} /> : <IconCopy size={15} />} {copied ? "Copied" : "Copy message"}
        </Button>
        <Button asChild variant="whatsapp" className="min-w-[120px] flex-1">
          <a href={user.phone ? waLink(user.phone, message) : undefined} target="_blank" rel="noreferrer" aria-disabled={!user.phone}>
            <IconWhatsApp size={15} /> WhatsApp
          </a>
        </Button>
        <Button asChild variant="line" className="min-w-[120px] flex-1">
          <a href={user.phone ? smsLink(user.phone, message) : undefined} aria-disabled={!user.phone}>
            <IconMessage size={15} /> SMS
          </a>
        </Button>
        <Button asChild variant="line" className="min-w-[120px] flex-1">
          <a href={mail}>
            <IconMail size={15} /> Email
          </a>
        </Button>
      </Stack>
      <Text variant="caption" className="mt-2.5 flex items-start gap-1.5">
        <IconAlert size={12} /> Namma MedMate opens WhatsApp / SMS / email prefilled — you press send. Nothing is sent automatically.
      </Text>
    </Modal>
  );
}

function CredentialCard({ label, value, copyLabel }: { label: string; value: string; copyLabel: string }) {
  return (
    <Box className="relative flex flex-col gap-0.5 rounded-[11px] border border-line bg-wash-2 px-[13px] py-[11px]">
      <Text variant="caption" className="text-[10px] font-extrabold uppercase tracking-[0.05em]">
        {label}
      </Text>
      <Text as="span" className="font-mono text-[15px] font-bold text-ink">
        {value}
      </Text>
      <Box className="absolute top-[9px] right-[9px]">
        <CopyButton text={value} label={copyLabel} />
      </Box>
    </Box>
  );
}
