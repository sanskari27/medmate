import type { PaymentModalProps } from "./PaymentModal.types";
import { Box, Button, Heading, Input, Label, Text } from "@/components/atoms";
import { cn } from "@/utils/className";
import type { ChangeEvent, MouseEvent } from "react";
import { useState } from "react";
import { usePharma } from "@/hooks";
import { inr, PayMode, PAY_LABEL } from "@/utils";
import { IconX } from "@/components/Icon";
export function PaymentModal({ onClose, outstanding, }: PaymentModalProps) {
    const { recordHospitalPayment } = usePharma();
    const [amount, setAmount] = useState(outstanding > 0 ? String(Math.round(outstanding)) : "");
    const [mode, setMode] = useState<PayMode>("upi");
    const [ref, setRef] = useState("");
    const amt = Number(amount) || 0;
    const MODES: PayMode[] = ["upi", "card", "cash"];
    return (<Box className="!fixed !inset-0 !z-[100] !flex !items-center !justify-center !bg-[rgba(13,32,21,0.5)] !p-6 !backdrop-blur-[3px]" onClick={onClose}>
      <Box onClick={stopPropagationOnClick} className={cn("!flex !max-h-[90vh] !w-full !max-w-[540px] !flex-col !overflow-hidden !rounded-lg !bg-paper !shadow-pop", "!max-w-[460px]")}>
        <Box className="!flex !items-center !justify-between !border-b !border-line !px-5 !py-4 [&_h3]:!text-[17px]">
          <Heading level={3}>Record hospital payment</Heading>
          <Button className="!grid !h-8 !w-8 !place-items-center !rounded-xs !border !border-line-2 !bg-paper !text-ink-2 hover:!bg-wash-2 hover:!text-mid" onClick={onClose}>
            <IconX size={18}/>
          </Button>
        </Box>
        <Box className="!overflow-y-auto !p-5">
          <Text className={cn("!text-muted", "!text-[12.5px] !mb-3")}>
            Outstanding: <Text as="span" className={cn("font-bold", "!text-rose")}>{inr(outstanding)}</Text>
          </Text>
          <Box className="!flex !flex-col !gap-1.5 [&_label]:!text-[11.5px] [&_label]:!font-bold [&_label]:!tracking-wide [&_label]:!text-ink-2" data-field="amount">
            <Label>Amount received ₹</Label>
            <Input className="" autoFocus type="number" min={0} value={amount} onChange={setAmountOnChange}/>
          </Box>
          <Box className={cn("!flex !flex-col !gap-1.5 [&_label]:!text-[11.5px] [&_label]:!font-bold [&_label]:!tracking-wide [&_label]:!text-ink-2", "!mt-3")}>
            <Label>Mode</Label>
            <Box className={cn("!flex !items-center !gap-1.5", "!mt-1")}>
              {MODES.map(renderMODES)}
            </Box>
          </Box>
          <Box className={cn("!flex !flex-col !gap-1.5 [&_label]:!text-[11.5px] [&_label]:!font-bold [&_label]:!tracking-wide [&_label]:!text-ink-2", "!mt-3")}>
            <Label>Reference (NEFT / UTR / cheque no.)</Label>
            <Input className="" value={ref} onChange={setRefOnChange} placeholder="Optional"/>
          </Box>
        </Box>
        <Box className="!mt-auto !flex !justify-end !gap-2.5 !border-t !border-line !px-5 !py-3.5">
          <Button className="!border !border-line-2 !bg-paper !text-ink-2 !shadow-none hover:!bg-wash-2" onClick={onClose}>
            Cancel
          </Button>
          <Button className="!border-transparent !bg-mid !text-white !shadow-sm hover:!bg-green" disabled={amt <= 0} onClick={recordHospitalPaymentOnClick}>
            Record {inr(amt)}
          </Button>
        </Box>
      </Box>
    </Box>);
    function stopPropagationOnClick(e: MouseEvent<HTMLDivElement>) {
        return e.stopPropagation();
    }
    function setAmountOnChange(e: ChangeEvent<HTMLInputElement>) {
        return setAmount(e.target.value);
    }
    function renderMODES(m: PayMode) {
        return (<Button key={m} className={`!inline-flex !h-auto !items-center !gap-[7px] !rounded-full !border !border-line-2 !bg-paper !px-3.5 !py-[7px] !text-[12.5px] !font-bold !text-ink-2 !shadow-none hover:!border-[#b9d0c2] hover:!bg-wash-2 ${mode === m ? " !border-dark !bg-dark !text-white hover:!bg-dark" : ""}`} onClick={setModeOnClick}>
                  {PAY_LABEL[m]}
                </Button>);
        function setModeOnClick() {
            return setMode(m);
        }
    }
    function setRefOnChange(e: ChangeEvent<HTMLInputElement>) {
        return setRef(e.target.value);
    }
    async function recordHospitalPaymentOnClick() {
        const err = await recordHospitalPayment({
            amount: amt,
            mode,
            ref: ref.trim() || undefined,
        });
        if (!err)
            onClose();
    }
}
