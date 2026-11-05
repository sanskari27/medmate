import type { KhataModalProps } from "./KhataModal.types";
import type { LedgerRow, UnpaidBill } from "@/utils";
import { Box, Button, Heading, Input, Select, Text } from "@/components/atoms";
import { cn } from "@/utils/className";
import type { ChangeEvent, MouseEvent } from "react";
import { useState } from "react";
import { inr, fmtDateTime, timeAgo, Sale, PayMode, PAY_LABEL, CreditPayment, CreditCustomer, customerLedger, SETTLED_MODES, waLink, smsLink, collectMsg, creditAging, CreditAging, } from "@/utils";
import { IconX, IconCheck, IconWhatsApp, IconMessage, IconRupee, IconReceipt, IconClock, IconPhone, } from "@/components/Icon";
export function KhataModal({ c, onClose, sales, creditPayments, recordCreditPayment, profile, now, go, }: KhataModalProps) {
    const ledger = customerLedger(c.key, sales, creditPayments);
    const aging: CreditAging = creditAging(c.key, sales, creditPayments, now);
    const [repay, setRepay] = useState(c.outstanding > 0);
    const [amt, setAmt] = useState(c.outstanding);
    const [mode, setMode] = useState<PayMode>("cash");
    const doRepay = async () => {
        if (amt <= 0)
            return;
        const err = await recordCreditPayment({
            custKey: c.key,
            custName: c.name,
            custPhone: c.phone,
            amount: Math.min(amt, c.outstanding || amt),
            mode,
        });
        if (!err)
            setRepay(false);
    };
    const collectText = collectMsg(c.name, profile.name, c.outstanding, profile.phone);
    const firstBillAt = Math.min(...ledger.filter((r) => r.kind === "debit").map((r) => r.at), now);
    return (<Box className="!fixed !inset-0 !z-[100] !flex !items-center !justify-center !bg-[rgba(13,32,21,0.5)] !p-6 !backdrop-blur-[3px]" onClick={onClose}>
      <Box className="!flex !max-h-[90vh] !w-full !max-w-[720px] !flex-col !overflow-hidden !rounded-lg !bg-paper !shadow-pop" onClick={stopPropagationOnClick}>
        <Box className="!flex !items-center !justify-between !border-b !border-line !px-5 !py-4 [&_h3]:!text-[17px]">
          <Box>
            <Heading className={cn("!flex !items-center !gap-2")} level={3}>
              {c.name} · Khata{" "}
              {aging.overdue && <Text className="!inline-flex !items-center !gap-1 !whitespace-nowrap !rounded-full !px-[9px] !py-[3px] !text-[11px] !font-bold !bg-rose-bg !text-rose" as="span">Overdue {aging.ageDays}d</Text>}
            </Heading>
            <Box className={cn("!text-muted", "!text-[12.5px] !mt-[3px] !flex !gap-3 !flex-wrap")}>
              <Text as="span">
                <IconPhone size={11}/> {c.phone || "—"}
              </Text>
              <Text as="span">
                <IconClock size={11}/> Credit since {fmtDateTime(firstBillAt).split(",")[0]}
              </Text>
            </Box>
          </Box>
          <Button className="!grid !h-8 !w-8 !place-items-center !rounded-sm !border-0 !bg-wash-2 !text-lg !text-ink-2 !shadow-none hover:!bg-wash" onClick={onClose}>
            <IconX size={18}/>
          </Button>
        </Box>
        <Box className="!overflow-y-auto !p-5">
          <Box className="!mb-3.5 !flex !flex-wrap !gap-2.5">
            <Box className="!rounded-[10px] !border !border-line !bg-paper !px-3.5 !py-2 !text-[12.5px] !text-muted ">
              Credit given<Text as="span" className="font-bold mt-px block font-display text-[15px] font-bold text-dark">{inr(c.given)}</Text>
            </Box>
            <Box className="!rounded-[10px] !border !border-line !bg-paper !px-3.5 !py-2 !text-[12.5px] !text-muted ">
              Repaid<Text as="span" className={cn("font-bold", "mt-px block font-display text-[15px] font-bold text-dark", "!text-green")}>{inr(c.repaid)}</Text>
            </Box>
            <Box className="!rounded-[10px] !border !border-line !bg-paper !px-3.5 !py-2 !text-[12.5px] !text-muted ">
              Outstanding
              <Text as="span" className={cn("font-bold", "mt-px block font-display text-[15px] font-bold text-dark", "!text-[15px]", c.outstanding > 0 ? "!text-rose" : "!text-green")}>
                {inr(c.outstanding)}
              </Text>
            </Box>
            <Box className="!rounded-[10px] !border !border-line !bg-paper !px-3.5 !py-2 !text-[12.5px] !text-muted ">
              Unpaid bills<Text as="span" className="font-bold mt-px block font-display text-[15px] font-bold text-dark">{aging.unpaidBills.length}</Text>
            </Box>
            <Box className="!rounded-[10px] !border !border-line !bg-paper !px-3.5 !py-2 !text-[12.5px] !text-muted ">
              Oldest due
              <Text as="span" className={cn("font-bold", "mt-px block font-display text-[15px] font-bold text-dark", aging.overdue ? "!text-rose" : undefined)}>
                {aging.oldestUnpaidAt ? `${aging.ageDays}d` : "—"}
              </Text>
            </Box>
          </Box>

          {/* actions */}
          <Box className={cn("!flex !items-center !gap-2.5", "!gap-2 !items-center !flex-wrap !mt-1.5 !mx-0 !mb-3")}>
            {c.outstanding > 0 && !repay && (<Button className="!border-transparent !bg-mid !text-white !shadow-sm hover:!bg-green" onClick={setAmtOnClick}>
                <IconRupee size={15}/> Record repayment
              </Button>)}
            <Button className="!border !border-line-2 !bg-paper !text-ink-2 !shadow-none hover:!bg-wash-2" disabled={!c.phone} onClick={openOnClick}>
              <IconWhatsApp size={15}/> Send reminder
            </Button>
            <Button className="!border !border-line-2 !bg-paper !text-ink-2 !shadow-none hover:!bg-wash-2" disabled={!c.phone} onClick={openOnClick2}>
              <IconMessage size={15}/> SMS
            </Button>
            <Button className="!border !border-line-2 !bg-paper !text-ink-2 !shadow-none hover:!bg-wash-2" onClick={onCloseOnClick}>
              <IconReceipt size={15}/> New credit sale
            </Button>
          </Box>

          {repay && c.outstanding > 0 && (<Box className={cn("!flex !flex-col !rounded-md !border !border-line !bg-paper !shadow-sm !flex-1 !p-[18px]", "!bg-wash-2 !mb-3.5")}>
              <Box className={cn("!flex !items-center !gap-2.5", "!gap-1.5 !flex-wrap !mb-2.5")}>
                {[500, 1000, 2000]
                .filter(matchV)
                .map(renderV)}
                <Button className={`!inline-flex !h-auto !items-center !gap-[7px] !rounded-full !border !border-line-2 !bg-paper !px-3.5 !py-[7px] !text-[12.5px] !font-bold !text-ink-2 !shadow-none hover:!border-[#b9d0c2] hover:!bg-wash-2 ${amt === Math.round(c.outstanding / 2) ? " !border-dark !bg-dark !text-white hover:!bg-dark" : ""}`} onClick={setAmtOnClick3}>
                  Half
                </Button>
                <Button className={`!inline-flex !h-auto !items-center !gap-[7px] !rounded-full !border !border-line-2 !bg-paper !px-3.5 !py-[7px] !text-[12.5px] !font-bold !text-ink-2 !shadow-none hover:!border-[#b9d0c2] hover:!bg-wash-2 ${amt === c.outstanding ? " !border-dark !bg-dark !text-white hover:!bg-dark" : ""}`} onClick={setAmtOnClick4}>
                  Full · {inr(c.outstanding)}
                </Button>
              </Box>
              <Box className={cn("!flex !items-center !gap-2.5", "!gap-2 !items-center !flex-wrap")}>
                <Input data-field="amount" type="number" min={0} value={amt || ""} onChange={setAmtOnChange} placeholder="Amount ₹" autoFocus className={cn("", "!w-[120px]")}/>
                <Select value={mode} onChange={setModeOnChange} className={cn("", "!w-[120px]")} options={[...(SETTLED_MODES.filter(matchSETTLEDMODES).map(renderM))]} />
                <Button className="!border-transparent !bg-mid !text-white !shadow-sm hover:!bg-green" disabled={amt <= 0} onClick={doRepay}>
                  <IconCheck size={14}/> Collect {inr(Math.min(amt, c.outstanding || amt))}
                </Button>
                <Button className="!border !border-line-2 !bg-paper !text-ink-2 !shadow-none hover:!bg-wash-2" onClick={setRepayOnClick}>
                  Cancel
                </Button>
              </Box>
            </Box>)}

          <Box className="!grid !grid-cols-[1.5fr_1fr] !gap-4 max-[767px]:!grid-cols-1">
            {/* unpaid bills */}
            <Box>
              <Box className={cn("!mt-4 !mb-0.5 !text-[11px] !font-extrabold !tracking-[0.08em] !text-faint !uppercase first:!mt-0", "!mt-0")}>
                Unpaid bills{" "}
                <Text className={cn("!text-muted", "!font-medium !text-[12px]")} as="span">
                  · FIFO
                </Text>
              </Box>
              <Box className={cn("!flex !flex-col !rounded-md !border !border-line !bg-paper !shadow-sm", "!overflow-hidden")}>
                {aging.unpaidBills.length === 0 ? (<Box className={cn("!px-5 !py-9 !text-center !text-muted [&_h3]:!mb-[5px] [&_h3]:!text-[15px] [&_h3]:!font-bold [&_h3]:!text-ink", "!p-4")}>
                    <Box className="mx-auto mb-3 grid h-11 w-11 place-items-center rounded-xl bg-wash text-[21px] leading-none text-mid">
                      <IconCheck size={24}/>
                    </Box>
                    <Text>Fully settled.</Text>
                  </Box>) : (aging.unpaidBills.map(renderUnpaidBill))}
              </Box>
            </Box>

            {/* full ledger */}
            <Box>
              <Box className={cn("!mt-4 !mb-0.5 !text-[11px] !font-extrabold !tracking-[0.08em] !text-faint !uppercase first:!mt-0", "!mt-0")}>
                Account ledger{" "}
                <Text className={cn("!text-muted", "!font-medium !text-[12px]")} as="span">
                  · {ledger.length}
                </Text>
              </Box>
              <Box className={cn("!flex !flex-col !rounded-md !border !border-line !bg-paper !shadow-sm", "!overflow-hidden !max-h-[260px] !overflow-y-auto")}>
                {ledger.length === 0 ? (<Box className={cn("!px-5 !py-9 !text-center !text-muted [&_h3]:!mb-[5px] [&_h3]:!text-[15px] [&_h3]:!font-bold [&_h3]:!text-ink", "!p-4")}>
                    <Text>No activity.</Text>
                  </Box>) : (ledger.map(renderLedger))}
              </Box>
            </Box>
          </Box>
        </Box>
        <Box className="!mt-auto !flex !justify-end !gap-2.5 !border-t !border-line !px-5 !py-3.5">
          <Button className="!border !border-line-2 !bg-paper !text-ink-2 !shadow-none hover:!bg-wash-2" onClick={onClose}>
            Close
          </Button>
          {c.outstanding > 0 && (<Button className="!border-transparent !bg-mid !text-white !shadow-sm hover:!bg-green" disabled={!c.phone} onClick={openOnClick3}>
              <IconWhatsApp size={15}/> Send reminder
            </Button>)}
        </Box>
      </Box>
    </Box>);
    function stopPropagationOnClick(e: MouseEvent<HTMLDivElement>) {
        return e.stopPropagation();
    }
    function setAmtOnClick() {
        setAmt(c.outstanding);
        setRepay(true);
    }
    function openOnClick() {
        return window.open(waLink(c.phone, collectText), "_blank");
    }
    function openOnClick2() {
        return window.open(smsLink(c.phone, collectText), "_blank");
    }
    function onCloseOnClick() {
        onClose();
        go("pos");
    }
    function renderV(v: number) {
        return (<Button key={v} className={`!inline-flex !h-auto !items-center !gap-[7px] !rounded-full !border !border-line-2 !bg-paper !px-3.5 !py-[7px] !text-[12.5px] !font-bold !text-ink-2 !shadow-none hover:!border-[#b9d0c2] hover:!bg-wash-2 ${amt === v ? " !border-dark !bg-dark !text-white hover:!bg-dark" : ""}`} onClick={setAmtOnClick2}>
                      {inr(v)}
                    </Button>);
        function setAmtOnClick2() {
            return setAmt(v);
        }
    }
    function matchV(v: number) {
        return v < c.outstanding;
    }
    function setAmtOnClick3() {
        return setAmt(Math.round(c.outstanding / 2));
    }
    function setAmtOnClick4() {
        return setAmt(c.outstanding);
    }
    function setAmtOnChange(e: ChangeEvent<HTMLInputElement>) {
        return setAmt(Number(e.target.value) || 0);
    }
    function setModeOnChange(e: ChangeEvent<HTMLSelectElement>) {
        return setMode(e.target.value as PayMode);
    }
    function renderM(m: "credit" | "cash" | "upi" | "card" | "insurance") {
        return { value: String(m), label: String(PAY_LABEL[m]) };
    }
    function matchSETTLEDMODES(m: PayMode) {
        return m !== "cod";
    }
    function setRepayOnClick() {
        return setRepay(false);
    }
    function renderUnpaidBill(b: UnpaidBill) {
        const d = Math.floor((now - b.at) / 86400000);
        return (<Box className="!flex !items-center !justify-between !border-b !border-line !py-2" key={b.id}>
                        <Text className={cn("grid h-[38px] w-[38px] shrink-0 place-items-center overflow-hidden rounded-[10px] bg-wash text-[18px] font-display font-bold leading-none text-mid", d > 30 ? "!text-rose" : "!text-mid")} as="span">
                          <IconReceipt size={14}/>
                        </Text>
                        <Text className="min-w-0 flex-1" as="span">
                          <Box className="text-[13.5px] font-bold text-ink !font-mono">{b.id}</Box>
                          <Box className="text-xs text-muted">
                            {fmtDateTime(b.at).split(",")[0]} · {b.items} items · {d}d old
                          </Box>
                        </Text>
                        <Text className={cn("!text-right")} as="span">
                          <Text as="span" className={cn("font-bold", "!text-rose !text-[13px]")}>{inr(b.remaining)}</Text>
                          {b.remaining < b.amount && (<Box className={cn("!text-muted", "!text-[10.5px]")}>
                              of {inr(b.amount)}
                            </Box>)}
                        </Text>
                      </Box>);
    }
    function renderLedger(r: LedgerRow, i: number) {
        return (<Box className="!flex !items-center !justify-between !border-b !border-line !py-2" key={i}>
                      <Text className={cn("grid h-[38px] w-[38px] shrink-0 place-items-center overflow-hidden rounded-[10px] bg-wash text-[18px] font-display font-bold leading-none text-mid", r.kind === "debit" ? "!text-rose" : "!text-green")} as="span">
                        {r.kind === "debit" ? "−" : "+"}
                      </Text>
                      <Text className="min-w-0 flex-1" as="span">
                        <Box className="text-[13.5px] font-bold text-ink">{r.label}</Box>
                        <Box className="text-xs text-muted !font-mono">
                          {r.ref} · {timeAgo(r.at, now)}
                        </Box>
                      </Text>
                      <Text as="span" className={cn("font-bold", "!text-[13px]", r.kind === "debit" ? "!text-rose" : "!text-green")}>
                        {r.kind === "debit" ? "−" : "+"}
                        {inr(r.amount)}
                      </Text>
                    </Box>);
    }
    function openOnClick3() {
        return window.open(waLink(c.phone, collectText), "_blank");
    }
}
