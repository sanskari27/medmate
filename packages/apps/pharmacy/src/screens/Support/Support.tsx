import { Box, Button, Heading, Input, Label, Select, Text, Textarea } from "@/components/atoms";
import { cn } from "@/utils/className";
import type { ChangeEvent, MouseEvent } from "react";
import { useState } from "react";
import { useAppSelector, useConfirmedDispatch } from "@/hooks";
import { raiseTicket } from "@/store/thunks/auth.thunk";
import { timeAgo } from "@/utils";
import { IconSend, IconX, IconTicket } from "@/components/atoms";
import { matchingFaqs } from "./Support.utils";
const FAQS = [
  {
    q: "How do I add a new medicine to inventory?",
    a: "Go to Inventory → Add product, or simply enter a distributor bill under Purchases → New purchase entry and stock is created automatically.",
  },
  {
    q: "How is GST calculated on my invoices?",
    a: "Selling prices (MRP) are GST-inclusive. The invoice backs out the taxable value and splits tax into CGST + SGST per slab automatically. Configure invoice text under Invoice Settings.",
  },
  {
    q: "Can I hide certain medicines from the online store?",
    a: "Yes — open Online Store and toggle a product off, or use the toggle in Inventory. Hidden items stay available for counter billing only.",
  },
  {
    q: "How do I reorder stock from my distributor?",
    a: "Open Reorder · Distributor. Low-stock items are grouped by their allotted distributor with suggested quantities — adjust and Send order. When goods arrive, record the bill under Purchases.",
  },
  {
    q: "How do I share reports with my CA?",
    a: "Open CA / Accountant, add your accountant, pick the period and reports, and tap Share. The share is saved on this account. Email is not sent automatically.",
  },
  {
    q: "What happens when my subscription expires?",
    a: "Billing and saved data stay safe. Online store and some advanced features pause until you renew under Subscription.",
  },
];
export default function SupportScreen() {
  const confirm = useConfirmedDispatch();
  const now = useAppSelector((state) => state.ui.now);
  const tickets = useAppSelector((state) => state.ui.tickets);
  const [openFaq, setOpenFaq] = useState<number | null>(0);
  const [show, setShow] = useState(false);
  const raise = async (subject: string, category: string) => {
    const result = await confirm(raiseTicket({ subject, category }));
    if ("data" in result) setShow(false);
  };
  return (
    <Box className={cn("!mx-auto !max-w-[1680px]", "!max-w-[1000px]")}>
      <Box className="!grid !grid-cols-[1.5fr_1fr] !gap-4 max-[767px]:!grid-cols-1">
        {/* FAQ */}
        <Box className="!flex !flex-col !rounded-md !border !border-line !bg-paper !shadow-sm">
          <Box className="!flex !flex-wrap !items-center !justify-between !gap-2.5 !border-b !border-line !px-[18px] !py-[15px] [&_h3]:!text-[15px] [&_h3]:!font-bold">
            <Heading level={3}>Frequently asked</Heading>
          </Box>
          <Box className={cn("!flex-1 !p-[18px]", "!pt-1.5 !pb-1.5")}>
            {matchingFaqs(FAQS, "").map(renderFAQS)}
          </Box>
        </Box>

        {/* tickets */}
        <Box className="!flex !flex-col !rounded-md !border !border-line !bg-paper !shadow-sm">
          <Box className="!flex !flex-wrap !items-center !justify-between !gap-2.5 !border-b !border-line !px-[18px] !py-[15px] [&_h3]:!text-[15px] [&_h3]:!font-bold">
            <Heading level={3}>Support tickets</Heading>
            <Button variant="primary" size="sm" onClick={setShowOnClick}>
              Raise ticket
            </Button>
          </Box>
          <Box className={cn("!flex-1 !p-[18px]", "!pt-1 !pb-1.5")}>
            {tickets.length === 0 ? (
              <Box className="px-6 py-6 text-center text-muted">
                <Box className="mx-auto mb-3 grid h-11 w-11 place-items-center rounded-xl bg-wash text-[21px] leading-none text-mid">
                  <IconTicket size={28} />
                </Box>
                <Text className="!text-muted">No tickets yet.</Text>
              </Box>
            ) : (
              tickets.map(renderTicket)
            )}
          </Box>
        </Box>
      </Box>

      {show && <TicketModal onClose={setShowOnClose} onRaise={raise} />}
    </Box>
  );
  function renderFAQS(
    f: {
      q: string;
      a: string;
    },
    i: number,
  ) {
    return (
      <Box key={i} className={cn("!border-b !border-line")}>
        <Button
          variant="ghost"
          onClick={setOpenFaqOnClick}
          className="!h-auto !w-full !justify-between !gap-2.5 !rounded-none !border-0 !bg-transparent !px-0 !py-3 !text-left !font-normal !text-ink !shadow-none hover:!bg-transparent active:!translate-y-0"
        >
          <Text className={cn("!font-bold !text-[13.5px]")} as="span">
            {f.q}
          </Text>
          <Text
            className={cn(
              "!text-muted",
              "!text-[16px] !transition",
              openFaq === i ? "!rotate-45" : "!rotate-0",
            )}
            as="span"
          >
            +
          </Text>
        </Button>
        {openFaq === i && (
          <Text className={cn("!text-muted", "!text-[13px] !pb-3 !leading-[1.55]")}>{f.a}</Text>
        )}
      </Box>
    );
    function setOpenFaqOnClick() {
      return setOpenFaq(openFaq === i ? null : i);
    }
  }
  function setShowOnClick() {
    return setShow(true);
  }
  function renderTicket(t: {
    id: string;
    subject: string;
    category: string;
    status: "Open" | "Resolved";
    createdAt: number;
  }) {
    return (
      <Box className="flex items-center gap-3 border-b border-line py-3 last:border-b-0" key={t.id}>
        <Text
          className="grid h-[38px] w-[38px] shrink-0 place-items-center overflow-hidden rounded-[10px] bg-wash text-[18px] font-display font-bold leading-none text-mid"
          as="span"
        >
          <IconTicket size={16} />
        </Text>
        <Text className="min-w-0 flex-1" as="span">
          <Box className="text-[13.5px] font-bold text-ink">{t.subject}</Box>
          <Box className="text-xs text-muted">
            {t.id} · {t.category} · {timeAgo(t.createdAt, now)}
          </Box>
        </Text>
        <Text
          className={`!inline-flex !items-center !gap-1 !whitespace-nowrap !rounded-full !px-[9px] !py-[3px] !text-[11px] !font-bold ${t.status === "Resolved" ? "!bg-wash !text-mid" : "!bg-amber-bg !text-gold-d"}`}
          as="span"
        >
          <Box className="inline-block h-1.5 w-1.5 shrink-0 rounded-full bg-current" />
          {t.status}
        </Text>
      </Box>
    );
  }
  function setShowOnClose() {
    return setShow(false);
  }
}
function TicketModal({
  onClose,
  onRaise,
}: {
  onClose: () => void;
  onRaise: (subject: string, category: string) => void;
}) {
  const [subject, setSubject] = useState("");
  const [category, setCategory] = useState("Billing");
  const [detail, setDetail] = useState("");
  return (
    <Box
      className="!fixed !inset-0 !z-[100] !flex !items-center !justify-center !bg-[rgba(13,32,21,0.5)] !p-6 !backdrop-blur-[3px]"
      onClick={onClose}
    >
      <Box
        className="!flex !max-h-[90vh] !w-full !max-w-[540px] !flex-col !overflow-hidden !rounded-lg !bg-paper !shadow-pop"
        onClick={stopPropagationOnClick}
      >
        <Box className="!flex !items-center !justify-between !border-b !border-line !px-5 !py-4 [&_h3]:!text-[17px]">
          <Heading level={3}>Raise a support ticket</Heading>
          <Button
            className="!grid !h-8 !w-8 !place-items-center !rounded-sm !border-0 !bg-wash-2 !text-lg !text-ink-2 !shadow-none hover:!bg-wash"
            onClick={onClose}
          >
            <IconX size={18} />
          </Button>
        </Box>
        <Box className="!overflow-y-auto !p-5">
          <Box className="!grid !grid-cols-2 !gap-3.5 max-[767px]:!grid-cols-1">
            <Box
              className="!flex !flex-col !gap-1.5 [&_label]:!text-[11.5px] [&_label]:!font-bold [&_label]:!tracking-wide [&_label]:!text-ink-2 !col-span-2 max-[767px]:!col-span-1"
              data-field="name"
            >
              <Label>Subject</Label>
              <Input
                className=""
                value={subject}
                onChange={setSubjectOnChange}
                placeholder="Briefly describe the issue"
              />
            </Box>
            <Box className="!flex !flex-col !gap-1.5 [&_label]:!text-[11.5px] [&_label]:!font-bold [&_label]:!tracking-wide [&_label]:!text-ink-2 !col-span-2 max-[767px]:!col-span-1">
              <Label>Category</Label>
              <Select
                className=""
                value={category}
                onChange={setCategoryOnChange}
                options={[
                  ...["Billing", "Inventory", "Online store", "Payments", "Account", "Other"].map(
                    renderC,
                  ),
                ]}
              />
            </Box>
            <Box className="!flex !flex-col !gap-1.5 [&_label]:!text-[11.5px] [&_label]:!font-bold [&_label]:!tracking-wide [&_label]:!text-ink-2 !col-span-2 max-[767px]:!col-span-1">
              <Label>Details</Label>
              <Textarea
                className="!min-h-16 !resize-y"
                value={detail}
                onChange={setDetailOnChange}
                placeholder="Tell us what happened…"
              />
            </Box>
          </Box>
        </Box>
        <Box className="!mt-auto !flex !justify-end !gap-2.5 !border-t !border-line !px-5 !py-3.5">
          <Button variant="ghost" onClick={onClose}>
            Cancel
          </Button>
          <Button variant="primary" disabled={!subject.trim()} onClick={onRaiseOnClick}>
            <IconSend size={15} /> Submit ticket
          </Button>
        </Box>
      </Box>
    </Box>
  );
  function stopPropagationOnClick(e: MouseEvent<HTMLDivElement>) {
    return e.stopPropagation();
  }
  function setSubjectOnChange(e: ChangeEvent<HTMLInputElement>) {
    return setSubject(e.target.value);
  }
  function setCategoryOnChange(e: ChangeEvent<HTMLSelectElement>) {
    return setCategory(e.target.value);
  }
  function renderC(c: string) {
    return { value: String(c), label: String(c) };
  }
  function setDetailOnChange(e: ChangeEvent<HTMLTextAreaElement>) {
    return setDetail(e.target.value);
  }
  function onRaiseOnClick() {
    return onRaise(subject, category);
  }
}
