import type { AdminOtpModalProps } from "./AdminOtpModal.types";
import { Box, Button, Heading, Input, Label, Text } from "@/components/atoms";
import { cn } from "@/utils/className";
import type { ChangeEvent, KeyboardEvent, MouseEvent } from "react";
import { useState } from "react";
import { usePharma } from "@/hooks";
import { IconX, IconLock } from "@/components/atoms";
export function AdminOtpModal({ onClose }: AdminOtpModalProps) {
    const { unlockPricing } = usePharma();
    const [otp, setOtp] = useState("");
    const demoCode = !import.meta.env.PROD ? "123456" : "";
    const submit = () => {
        void unlockPricing(otp).then((ok) => {
            if (ok)
                onClose();
        });
    };
    return (<Box className="!fixed !inset-0 !z-[100] !flex !items-center !justify-center !bg-[rgba(13,32,21,0.5)] !p-6 !backdrop-blur-[3px]" onClick={onClose}>
      <Box onClick={stopPropagationOnClick} className={cn("!flex !max-h-[90vh] !w-full !max-w-[540px] !flex-col !overflow-hidden !rounded-lg !bg-paper !shadow-pop", "!max-w-[420px]")}>
        <Box className="!flex !items-center !justify-between !border-b !border-line !px-5 !py-4 [&_h3]:!text-[17px]">
          <Heading level={3}>
            <IconLock size={16}/> Admin approval
          </Heading>
          <Button className="!grid !h-8 !w-8 !place-items-center !rounded-xs !border !border-line-2 !bg-paper !text-ink-2 hover:!bg-wash-2 hover:!text-mid" onClick={onClose}>
            <IconX size={18}/>
          </Button>
        </Box>
        <Box className="!overflow-y-auto !p-5">
          <Text className={cn("!text-muted", "!text-[13px] !mb-3")}>
            Institutional pricing is protected. Enter the admin OTP to make changes.
          </Text>
          <Box className="!flex !flex-col !gap-1.5 [&_label]:!text-[11.5px] [&_label]:!font-bold [&_label]:!tracking-wide [&_label]:!text-ink-2" data-field="otp">
            <Label>Admin OTP</Label>
            <Input inputMode="numeric" maxLength={6} value={otp} autoFocus onChange={setOtpOnChange} onKeyDown={submitOnKeyDown} placeholder="••••••" className={cn("!font-mono", "!tracking-[.4em] !text-center !text-[18px]")}/>
          </Box>
          {demoCode ? (<Box className={cn("!text-muted", "!text-[12px] !mt-2 !bg-wash-2 !border !border-line-2 !border-dashed !rounded-sm !py-[7px] !px-[11px]")}>
              Demo admin OTP: <Text as="span" className="font-bold">{demoCode}</Text>{" "}
              <Button onClick={setOtpOnClick} className={cn("!border !border-line-2 !bg-paper !text-ink-2 !shadow-none hover:!bg-wash-2 !h-auto !rounded-xs !px-[11px] !py-1.5 !text-xs", "!ml-1.5")}>
                Auto-fill
              </Button>
            </Box>) : null}
        </Box>
        <Box className="!mt-auto !flex !justify-end !gap-2.5 !border-t !border-line !px-5 !py-3.5">
          <Button className="!border !border-line-2 !bg-paper !text-ink-2 !shadow-none hover:!bg-wash-2" onClick={onClose}>
            Cancel
          </Button>
          <Button className="!border-transparent !bg-mid !text-white !shadow-sm hover:!bg-green" disabled={otp.length !== 6} onClick={submit}>
            Unlock pricing
          </Button>
        </Box>
      </Box>
    </Box>);
    function stopPropagationOnClick(e: MouseEvent<HTMLDivElement>) {
        return e.stopPropagation();
    }
    function setOtpOnChange(e: ChangeEvent<HTMLInputElement>) {
        return setOtp(e.target.value.replace(/\D/g, ""));
    }
    function submitOnKeyDown(e: KeyboardEvent<HTMLInputElement>) {
        return e.key === "Enter" && submit();
    }
    function setOtpOnClick() {
        return setOtp(demoCode);
    }
}
