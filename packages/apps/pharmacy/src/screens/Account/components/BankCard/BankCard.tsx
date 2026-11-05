import { Box, Button, Heading, Input, Label, Select, Text } from "@/components/atoms";
import { cn } from "@/utils/className";
import type { ChangeEvent } from "react";
import { useState } from "react";
import { usePharma } from "@/hooks";
import { isValidIfsc } from "@/utils";
import { IconCheck, IconBank } from "@/components/Icon";
import { bankForm } from "@/screens/Account/utils/bankForm";
const blankBank = {
    holderName: "",
    accountNumber: "",
    ifsc: "",
    bankName: "",
    branch: "",
    accountType: "Current" as const,
    upiVpa: "",
};
export function BankCard() {
    const { bankAccount, saveBankAccount, verifyBankAccount, removeBankAccount } = usePharma();
    const [f, setF] = useState(() => bankForm(bankAccount));
    const set = (patch: Partial<typeof f>) => setF((p) => ({ ...p, ...patch }));
    const ifscOk = isValidIfsc(f.ifsc);
    const canSave = !!f.holderName.trim() && !!f.accountNumber.trim() && !!f.bankName.trim() && ifscOk;
    const save = async () => {
        await saveBankAccount({
            holderName: f.holderName.trim(),
            accountNumber: f.accountNumber.replace(/\s/g, ""),
            ifsc: f.ifsc.trim().toUpperCase(),
            bankName: f.bankName.trim(),
            branch: f.branch.trim() || undefined,
            accountType: f.accountType,
            upiVpa: f.upiVpa.trim() || undefined,
        });
    };
    return (<Box id="!rounded-md !border !border-line !bg-paper !p-4" className={cn("!flex !flex-col !rounded-md !border !border-line !bg-paper !shadow-sm", "!mt-4")}>
      <Box className="!flex !flex-wrap !items-center !justify-between !gap-2.5 !border-b !border-line !px-[18px] !py-[15px] [&_h3]:!text-[15px] [&_h3]:!font-bold">
        <Heading level={3}>
          <Text className="!flex !items-center !gap-1.5" as="span">
            <IconBank size={16}/> Payout bank account
          </Text>
        </Heading>
        {bankAccount?.verified ? (<Text className="!inline-flex !items-center !gap-1 !whitespace-nowrap !rounded-full !px-[9px] !py-[3px] !text-[11px] !font-bold !bg-wash !text-mid" as="span">
            <IconCheck size={12}/> Verified
          </Text>) : bankAccount ? (<Text className="!inline-flex !items-center !gap-1 !whitespace-nowrap !rounded-full !px-[9px] !py-[3px] !text-[11px] !font-bold !bg-amber-bg !text-gold-d" as="span">Verification pending</Text>) : null}
      </Box>
      <Box className="!flex-1 !p-[18px]">
        <Box className="!grid !grid-cols-2 !gap-3.5 max-[767px]:!grid-cols-1">
          <Box className="!flex !flex-col !gap-1.5 [&_label]:!text-[11.5px] [&_label]:!font-bold [&_label]:!tracking-wide [&_label]:!text-ink-2">
            <Label>Account holder</Label>
            <Input className="" value={f.holderName} onChange={setOnChange}/>
          </Box>
          <Box className="!flex !flex-col !gap-1.5 [&_label]:!text-[11.5px] [&_label]:!font-bold [&_label]:!tracking-wide [&_label]:!text-ink-2">
            <Label>Account number</Label>
            <Input className="!font-mono" value={f.accountNumber} onChange={setOnChange2}/>
          </Box>
          <Box className="!flex !flex-col !gap-1.5 [&_label]:!text-[11.5px] [&_label]:!font-bold [&_label]:!tracking-wide [&_label]:!text-ink-2" data-field="ifsc">
            <Label>IFSC</Label>
            <Input className="!font-mono" value={f.ifsc} onChange={setOnChange3} placeholder="HDFC0001234"/>
          </Box>
          <Box className="!flex !flex-col !gap-1.5 [&_label]:!text-[11.5px] [&_label]:!font-bold [&_label]:!tracking-wide [&_label]:!text-ink-2">
            <Label>Bank</Label>
            <Input className="" value={f.bankName} onChange={setOnChange4}/>
          </Box>
          <Box className="!flex !flex-col !gap-1.5 [&_label]:!text-[11.5px] [&_label]:!font-bold [&_label]:!tracking-wide [&_label]:!text-ink-2">
            <Label>Branch</Label>
            <Input className="" value={f.branch} onChange={setOnChange5}/>
          </Box>
          <Box className="!flex !flex-col !gap-1.5 [&_label]:!text-[11.5px] [&_label]:!font-bold [&_label]:!tracking-wide [&_label]:!text-ink-2">
            <Label>Type</Label>
            <Select className="" value={f.accountType} onChange={setOnChange6} options={[{ value: "Current", label: "Current" }, { value: "Savings", label: "Savings" }]} />
          </Box>
          <Box className="!flex !flex-col !gap-1.5 [&_label]:!text-[11.5px] [&_label]:!font-bold [&_label]:!tracking-wide [&_label]:!text-ink-2 !col-span-2 max-[767px]:!col-span-1">
            <Label>UPI (optional)</Label>
            <Input className="" value={f.upiVpa} onChange={setOnChange7} placeholder="name@upi"/>
          </Box>
        </Box>
        {f.ifsc.trim() && !ifscOk ? (<Text className={cn("!text-muted", "!text-[12px] !text-rose !mt-2")}>
            Enter a valid IFSC (4 letters, 0, then 6 characters).
          </Text>) : null}
        <Box className={cn("!flex !items-center !gap-1.5", "!mt-3.5")}>
          <Button className="!border-transparent !bg-mid !text-white !shadow-sm hover:!bg-green" disabled={!canSave} onClick={save}>
            Save account
          </Button>
          {bankAccount && !bankAccount.verified ? (<Button className="!border !border-line-2 !bg-paper !text-ink-2 !shadow-none hover:!bg-wash-2" onClick={verifyBankAccount}>
              Mark verified
            </Button>) : null}
          {bankAccount ? (<Button onClick={removeBankAccountOnClick} className={cn("!border !border-line-2 !bg-paper !text-ink-2 !shadow-none hover:!bg-wash-2", "!text-rose")}>
              Remove
            </Button>) : null}
        </Box>
        <Text className={cn("!text-muted", "!text-[12px] !mt-2")}>
          Verification is stored on this pharmacy. No bank is contacted.
        </Text>
      </Box>
    </Box>);
    function setOnChange(e: ChangeEvent<HTMLInputElement>) {
        return set({ holderName: e.target.value });
    }
    function setOnChange2(e: ChangeEvent<HTMLInputElement>) {
        return set({ accountNumber: e.target.value });
    }
    function setOnChange3(e: ChangeEvent<HTMLInputElement>) {
        return set({ ifsc: e.target.value.toUpperCase() });
    }
    function setOnChange4(e: ChangeEvent<HTMLInputElement>) {
        return set({ bankName: e.target.value });
    }
    function setOnChange5(e: ChangeEvent<HTMLInputElement>) {
        return set({ branch: e.target.value });
    }
    function setOnChange6(e: ChangeEvent<HTMLSelectElement>) {
        return set({ accountType: e.target.value as "Savings" | "Current" });
    }
    function setOnChange7(e: ChangeEvent<HTMLInputElement>) {
        return set({ upiVpa: e.target.value });
    }
    function removeBankAccountOnClick() {
        removeBankAccount();
        setF(blankBank);
    }
}
