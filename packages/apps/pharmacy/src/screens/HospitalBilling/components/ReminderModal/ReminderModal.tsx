import type { ReminderModalProps } from "./ReminderModal.types";
import { Box, Button, Heading, Text } from "@/components/atoms";
import { cn } from "@/utils/className";
import type { MouseEvent } from "react";
import { useState } from "react";
import { usePharma } from "@/hooks";
import { inr, waLink, smsLink } from "@/utils";
import { IconX, IconAlert, IconWhatsApp, IconMail, IconCheck, IconCopy } from "@/components/atoms";
import { fmtDay } from "@/utils/date";
export function ReminderModal({ onClose, outstanding, aging }: ReminderModalProps) {
  const { hospitalAccount: a, profile } = usePharma();
  const [copied, setCopied] = useState(false);
  const msg = [
    `Dear ${a.name},`,
    ``,
    `This is a payment reminder from ${profile.name}.`,
    `Outstanding on your credit account: ${inr(outstanding)}.`,
    ...(aging.overdue > 0
      ? [
          `Overdue (past ${a.creditTerms}): ${inr(aging.overdue)}${aging.dueDate ? `, due ${fmtDay(aging.dueDate)}` : ""}.`,
        ]
      : []),
    ``,
    `Kindly arrange settlement at your earliest. Thank you.`,
  ].join("\n");
  const phone = a.phone || "";
  const mail = `mailto:${a.email || ""}?subject=${encodeURIComponent(`Payment reminder — ${inr(outstanding)} outstanding`)}&body=${encodeURIComponent(msg)}`;
  return (
    <Box
      className="!fixed !inset-0 !z-[100] !flex !items-center !justify-center !bg-[rgba(13,32,21,0.5)] !p-6 !backdrop-blur-[3px] animate-[pd-fade_0.16s_ease] motion-reduce:animate-none max-[767px]:!items-end max-[767px]:!p-0"
      onClick={onClose}
    >
      <Box
        className="!flex !max-h-[90vh] !w-full !max-w-[540px] !flex-col !overflow-hidden !rounded-lg !bg-paper !shadow-pop animate-[pd-pop_0.2s_cubic-bezier(0.2,0.9,0.3,1.2)] motion-reduce:animate-none max-[767px]:!max-h-[92dvh] max-[767px]:!max-w-none max-[767px]:!rounded-t-2xl max-[767px]:!rounded-b-none"
        onClick={stopPropagationOnClick}
      >
        <Box className="!flex !items-center !justify-between !border-b !border-line !px-5 !py-4 [&_h3]:!text-[17px]">
          <Heading level={3}>Send payment reminder</Heading>
          <Button
            className="!grid !h-8 !w-8 !place-items-center !rounded-xs !border !border-line-2 !bg-paper !text-ink-2 hover:!bg-wash-2 hover:!text-mid !p-0 !shadow-none"
            onClick={onClose}
          >
            <IconX size={18} />
          </Button>
        </Box>
        <Box className="!overflow-y-auto !p-5">
          <Box className={cn("!mb-3.5 !flex !flex-wrap !gap-2.5", "!mb-3")}>
            <Box className="!rounded-[10px] !border !border-line !bg-paper !px-3.5 !py-2 !text-[12.5px] !text-muted ">
              Outstanding
              <Text
                as="span"
                className={cn(
                  "font-bold",
                  "mt-px block font-display text-[15px] font-bold text-dark",
                  "!text-rose",
                )}
              >
                {inr(outstanding)}
              </Text>
            </Box>
            {aging.overdue > 0 && (
              <Box className="!rounded-[10px] !border !border-line !bg-paper !px-3.5 !py-2 !text-[12.5px] !text-muted ">
                Overdue
                <Text
                  as="span"
                  className={cn(
                    "font-bold",
                    "mt-px block font-display text-[15px] font-bold text-dark",
                    "!text-rose",
                  )}
                >
                  {inr(aging.overdue)}
                </Text>
              </Box>
            )}
            <Box className="!rounded-[10px] !border !border-line !bg-paper !px-3.5 !py-2 !text-[12.5px] !text-muted ">
              Terms
              <Text
                as="span"
                className="font-bold mt-px block font-display text-[15px] font-bold text-dark"
              >
                {a.creditTerms}
              </Text>
            </Box>
          </Box>
          <Box className="!max-h-[220px] !overflow-auto !rounded-[11px] !bg-ink !p-[13px_15px] !font-mono !text-[11.5px] !leading-normal !whitespace-pre-wrap !text-[#d7ebe0]">
            {msg}
          </Box>
          <Box className="!mt-[13px] !flex !flex-wrap !gap-[9px]">
            <Button variant="line" className="!min-w-[120px] !flex-1" onClick={writeTextOnClick}>
              {copied ? <IconCheck size={15} /> : <IconCopy size={15} />}{" "}
              {copied ? "Copied" : "Copy"}
            </Button>
            <Button asChild variant="whatsapp" className="!min-w-[120px] !flex-1">
              <a
                href={phone ? waLink(phone, msg) : undefined}
                target="_blank"
                rel="noreferrer"
                aria-disabled={!phone}
              >
                <IconWhatsApp size={15} /> WhatsApp
              </a>
            </Button>
            <Button asChild variant="line" className="!min-w-[120px] !flex-1">
              <a href={phone ? smsLink(phone, msg) : undefined} aria-disabled={!phone}>
                SMS
              </a>
            </Button>
            <Button asChild variant="line" className="!min-w-[120px] !flex-1">
              <a href={mail}>
                <IconMail size={15} /> Email
              </a>
            </Button>
          </Box>
          <Text className="!mt-2.5 !flex !items-start !gap-1.5 !text-[11.5px] !leading-snug !text-muted">
            <IconAlert size={12} /> Opens WhatsApp / SMS / email prefilled to the hospital's billing
            contact — you press send.
          </Text>
        </Box>
        <Box className="!mt-auto !flex !justify-end !gap-2.5 !border-t !border-line !px-5 !py-3.5 max-[767px]:!flex-wrap max-[767px]:[&_button]:!flex-1">
          <Button variant="primary" onClick={onClose}>
            Done
          </Button>
        </Box>
      </Box>
    </Box>
  );
  function stopPropagationOnClick(e: MouseEvent<HTMLDivElement>) {
    return e.stopPropagation();
  }
  function writeTextOnClick() {
    navigator.clipboard?.writeText(msg);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  }
}
