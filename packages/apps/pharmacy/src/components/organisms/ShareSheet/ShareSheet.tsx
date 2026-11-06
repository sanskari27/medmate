import { useState } from "react";
import { cva } from "class-variance-authority";
import { Button } from "@/components/atoms/Button";
import { Box } from "@/components/atoms/Box";
import { Grid } from "@/components/atoms/Grid";
import { Input } from "@/components/atoms/Input";
import { MonoText } from "@/components/atoms/MonoText";
import { Stack } from "@/components/atoms/Stack";
import { Text } from "@/components/atoms/Text";
import {
  IconCheck,
  IconLink,
  IconMail,
  IconMessage,
  IconPrint,
  IconWhatsApp,
} from "@/components/atoms/Icon";
import { Field } from "@/components/molecules/Field";
import { Modal } from "@/components/molecules/Modal";
import { useAppDispatch } from "@/hooks";
import { showToast } from "@/store/actions/feedback.actions";
import { computeInvoice, inr } from "@/utils";
import { buildInvoicePdf } from "@/utils/pdf";
import type { ChangeEvent } from "react";
import type { ShareKind, ShareOption, ShareSheetProps } from "./ShareSheet.types";

const shareTone = cva("grid h-10 w-10 shrink-0 place-items-center rounded-md", {
  variants: {
    kind: {
      whatsapp: "bg-wash text-mid",
      sms: "bg-blue-bg text-blue",
      email: "bg-amber-bg text-gold-d",
      pdf: "bg-wash text-muted",
    },
  },
});

function ShareGlyph({ kind }: { kind: ShareKind }) {
  if (kind === "whatsapp") return <IconWhatsApp size={20} />;
  if (kind === "sms") return <IconMessage size={20} />;
  if (kind === "email") return <IconMail size={20} />;
  return <IconPrint size={20} />;
}

function ShareOptionButton({ option }: { option: ShareOption }) {
  function onOptionClick() {
    option.onClick();
  }
  return (
    <Button
      variant="ghost"
      className="h-auto w-full justify-start gap-2.5 whitespace-normal px-3 py-3 text-left"
      onClick={onOptionClick}
    >
      <Box className={shareTone({ kind: option.kind })}>
        <ShareGlyph kind={option.kind} />
      </Box>
      <Stack gap={0}>
        <Text as="span" className="text-[13.5px] font-bold">
          {option.title}
        </Text>
        <Text variant="caption">{option.subtitle}</Text>
      </Stack>
    </Button>
  );
}

function ShareOptions({ options }: { options: ShareOption[] }) {
  return options.map(function renderOption(option) {
    return <ShareOptionButton key={option.title} option={option} />;
  });
}

function CopyLabel({ copied }: { copied: boolean }) {
  if (copied) {
    return (
      <>
        <IconCheck size={13} /> Copied
      </>
    );
  }
  return <>Copy</>;
}

export default function ShareSheet({ sale, profile, onClose, className }: ShareSheetProps) {
  const dispatch = useAppDispatch();
  function toast(message: string) {
    dispatch(showToast(message));
  }
  const [phone, setPhone] = useState(sale.customer.phone ?? "");
  const [email, setEmail] = useState("");
  const [copied, setCopied] = useState(false);

  const total = inr(computeInvoice(sale.items, sale.discount).payable);
  const link = `https://bills.nammamedmate.in/${sale.id.replace(/[^A-Za-z0-9-]/g, "")}`;
  const name =
    sale.customer.name && sale.customer.name !== "Walk-in" ? " " + sale.customer.name : "";
  const msg = `Hi${name}, here is your bill ${sale.id} from ${profile.name} for ${total}${sale.paid === false ? " (payment pending)" : ""}. Open the link to view & download your PDF bill: ${link}`;
  const digits = phone.replace(/\D/g, "");
  const wa = digits ? (digits.length > 10 ? digits : "91" + digits.slice(-10)) : "";

  function open(url: string) {
    const popup = window.open(url, "_blank");
    if (!popup) window.location.href = url;
  }
  function openPdf() {
    const url = URL.createObjectURL(buildInvoicePdf(sale, profile));
    window.open(url, "_blank");
    setTimeout(function revoke() {
      URL.revokeObjectURL(url);
    }, 60000);
  }
  function onWhatsApp() {
    open(`https://wa.me/${wa}?text=${encodeURIComponent(msg)}`);
    toast("Opening WhatsApp with bill link…");
  }
  function onSMS() {
    open(`sms:${digits}?&body=${encodeURIComponent(msg)}`);
    toast("Opening SMS with bill link…");
  }
  function onEmail() {
    open(
      `mailto:${email}?subject=${encodeURIComponent("Bill " + sale.id + " - " + profile.name)}&body=${encodeURIComponent(msg)}`,
    );
    toast("Opening email with bill link…");
  }
  function onCopy() {
    try {
      navigator.clipboard?.writeText(link);
    } catch {
      /* clipboard may be unavailable */
    }
    setCopied(true);
    toast("Bill link copied");
    setTimeout(function resetCopied() {
      setCopied(false);
    }, 1500);
  }
  function onPhoneChange(event: ChangeEvent<HTMLInputElement>) {
    setPhone(event.target.value);
  }
  function onEmailChange(event: ChangeEvent<HTMLInputElement>) {
    setEmail(event.target.value);
  }

  const options: ShareOption[] = [
    {
      kind: "whatsapp",
      title: "WhatsApp",
      subtitle: "Send bill link on WhatsApp",
      onClick: onWhatsApp,
    },
    { kind: "sms", title: "SMS", subtitle: "Text the bill link", onClick: onSMS },
    { kind: "email", title: "Email", subtitle: "Email the bill link", onClick: onEmail },
    { kind: "pdf", title: "Open PDF", subtitle: "Preview / save / print", onClick: openPdf },
  ];

  return (
    <Modal title={`Share bill ${sale.id}`} onClose={onClose} className={className} size="md">
      <Stack data-slot="share-sheet" gap={3}>
        <Grid columns={2} gap={3}>
          <Field label="Customer phone">
            <Input value={phone} onChange={onPhoneChange} placeholder="+91 …" />
          </Field>
          <Field label="Customer email">
            <Input value={email} onChange={onEmailChange} placeholder="name@email.com" />
          </Field>
        </Grid>
        <Grid columns={2} gap={3}>
          <ShareOptions options={options} />
        </Grid>
        <Stack gap={1}>
          <Text variant="caption" className="font-bold">
            Bill link
          </Text>
          <Stack
            direction="row"
            align="center"
            gap={2}
            className="rounded-md border border-line bg-wash-2 px-2.5 py-2"
          >
            <IconLink size={15} />
            <MonoText size="sm" className="min-w-0 flex-1 truncate">
              {link}
            </MonoText>
            <Button variant="ghost" size="sm" onClick={openPdf}>
              Open
            </Button>
            <Button variant="ghost" size="sm" onClick={onCopy}>
              <CopyLabel copied={copied} />
            </Button>
          </Stack>
        </Stack>
        <Text variant="caption">
          <IconLink size={13} /> WhatsApp, SMS & Email all share a secure bill link — the customer
          opens it to view & download the PDF. No app needed.
        </Text>
      </Stack>
    </Modal>
  );
}

export type { ShareSheetProps };
