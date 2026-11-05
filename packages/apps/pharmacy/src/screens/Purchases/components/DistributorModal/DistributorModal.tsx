import type { DistributorModalProps } from "./DistributorModal.types";
import { Box, Button, Heading, Input, Label, Select, Text } from "@/components/atoms";
import { cn } from "@/utils/className";
import type { ChangeEvent, MouseEvent } from "react";
import { useState } from "react";
import { usePharma } from "@/hooks";
import { Supplier, isValidGstin } from "@/utils";
import { IconX } from "@/components/atoms";
const BLANK_SUP: Omit<Supplier, "id"> = {
    name: "",
    gstin: "",
    phone: "",
    contactPerson: "",
    email: "",
    address: "",
    city: "",
    state: "Karnataka",
    dlNo: "",
    paymentTerms: "30 days credit",
    outstanding: 0,
    active: true,
};
export function DistributorModal({ init, onClose, onSave, }: DistributorModalProps) {
    const { showFault } = usePharma();
    const [f, setF] = useState<Omit<Supplier, "id">>(init ? { ...init } : { ...BLANK_SUP });
    const set = (p: Partial<typeof f>) => setF((s) => ({ ...s, ...p }));
    return (<Box className="!fixed !inset-0 !z-[100] !flex !items-center !justify-center !bg-[rgba(13,32,21,0.5)] !p-6 !backdrop-blur-[3px]" onClick={onClose}>
      <Box onClick={stopPropagationOnClick} className={cn("!flex !max-h-[90vh] !w-full !max-w-[540px] !flex-col !overflow-hidden !rounded-lg !bg-paper !shadow-pop", "!max-w-[640px]")}>
        <Box className="!flex !items-center !justify-between !border-b !border-line !px-5 !py-4 [&_h3]:!text-[17px]">
          <Heading level={3}>{init ? "Edit distributor" : "Add distributor"}</Heading>
          <Button className="!grid !h-8 !w-8 !place-items-center !rounded-sm !border-0 !bg-wash-2 !text-lg !text-ink-2 !shadow-none hover:!bg-wash" onClick={onClose}>
            <IconX size={18}/>
          </Button>
        </Box>
        <Box className="!overflow-y-auto !p-5">
          <Box className="!grid !grid-cols-2 !gap-3.5 max-[767px]:!grid-cols-1">
            <Box className="!flex !flex-col !gap-1.5 [&_label]:!text-[11.5px] [&_label]:!font-bold [&_label]:!tracking-wide [&_label]:!text-ink-2 !col-span-2 max-[767px]:!col-span-1" data-field="name">
              <Label>Distributor / firm name *</Label>
              <Input className="" value={f.name} onChange={setOnChange} placeholder="e.g. Bengaluru Pharma Distributors"/>
            </Box>
            <Box className="!flex !flex-col !gap-1.5 [&_label]:!text-[11.5px] [&_label]:!font-bold [&_label]:!tracking-wide [&_label]:!text-ink-2">
              <Label>Contact person</Label>
              <Input className="" value={f.contactPerson || ""} onChange={setOnChange2}/>
            </Box>
            <Box className="!flex !flex-col !gap-1.5 [&_label]:!text-[11.5px] [&_label]:!font-bold [&_label]:!tracking-wide [&_label]:!text-ink-2" data-field="phone">
              <Label>Phone *</Label>
              <Input className="" value={f.phone} onChange={setOnChange3} placeholder="+91 …"/>
            </Box>
            <Box className="!flex !flex-col !gap-1.5 [&_label]:!text-[11.5px] [&_label]:!font-bold [&_label]:!tracking-wide [&_label]:!text-ink-2" data-field="email">
              <Label>Email</Label>
              <Input className="" value={f.email || ""} onChange={setOnChange4}/>
            </Box>
            <Box className="!flex !flex-col !gap-1.5 [&_label]:!text-[11.5px] [&_label]:!font-bold [&_label]:!tracking-wide [&_label]:!text-ink-2" data-field="gstin">
              <Label>GSTIN</Label>
              <Input className="!font-mono" value={f.gstin} onChange={setOnChange5} placeholder="29ABCDE1234F1Z5"/>
            </Box>
            <Box className="!flex !flex-col !gap-1.5 [&_label]:!text-[11.5px] [&_label]:!font-bold [&_label]:!tracking-wide [&_label]:!text-ink-2">
              <Label>Drug licence no.</Label>
              <Input className="!font-mono" value={f.dlNo || ""} onChange={setOnChange6} placeholder="KA-W-…"/>
            </Box>
            <Box className="!flex !flex-col !gap-1.5 [&_label]:!text-[11.5px] [&_label]:!font-bold [&_label]:!tracking-wide [&_label]:!text-ink-2 !col-span-2 max-[767px]:!col-span-1">
              <Label>Address</Label>
              <Input className="" value={f.address || ""} onChange={setOnChange7}/>
            </Box>
            <Box className="!flex !flex-col !gap-1.5 [&_label]:!text-[11.5px] [&_label]:!font-bold [&_label]:!tracking-wide [&_label]:!text-ink-2">
              <Label>City</Label>
              <Input className="" value={f.city || ""} onChange={setOnChange8}/>
            </Box>
            <Box className="!flex !flex-col !gap-1.5 [&_label]:!text-[11.5px] [&_label]:!font-bold [&_label]:!tracking-wide [&_label]:!text-ink-2">
              <Label>State</Label>
              <Input className="" value={f.state || ""} onChange={setOnChange9}/>
            </Box>
            <Box className="!flex !flex-col !gap-1.5 [&_label]:!text-[11.5px] [&_label]:!font-bold [&_label]:!tracking-wide [&_label]:!text-ink-2">
              <Label>Payment terms</Label>
              <Select className="" value={f.paymentTerms || ""} onChange={setOnChange10} options={[{ value: "Advance", label: "Advance" }, { value: "On delivery", label: "On delivery" }, { value: "7 days credit", label: "7 days credit" }, { value: "15 days credit", label: "15 days credit" }, { value: "30 days credit", label: "30 days credit" }, { value: "45 days credit", label: "45 days credit" }]} />
            </Box>
            <Box className="!flex !flex-col !gap-1.5 [&_label]:!text-[11.5px] [&_label]:!font-bold [&_label]:!tracking-wide [&_label]:!text-ink-2">
              <Label>Outstanding payable (₹)</Label>
              <Input className="" type="number" value={f.outstanding ?? 0} onChange={setOnChange11}/>
            </Box>
          </Box>
          <Box className={cn("!flex !items-center !gap-2.5", "!mt-4 !gap-2.5 !items-center")}>
            <Button type="button" className={`!relative !h-[22px] !w-[38px] !shrink-0 !rounded-full !border-0 !bg-[#cddcd3] !p-0 !shadow-none after:!absolute after:!top-0.5 after:!left-0.5 after:!h-[18px] after:!w-[18px] after:!rounded-full after:!bg-white after:!shadow after:!transition after:!content-['']${f.active !== false ? "!bg-mid after:!translate-x-4" : ""}`} onClick={setOnClick} aria-label="Toggle active"/>
            <Text className={cn("!text-[13px] !font-semibold")} as="span">
              Active — show in purchases & reorder lists
            </Text>
          </Box>
        </Box>
        <Box className="!mt-auto !flex !justify-end !gap-2.5 !border-t !border-line !px-5 !py-3.5">
          <Button className="!border !border-line-2 !bg-paper !text-ink-2 !shadow-none hover:!bg-wash-2" onClick={onClose}>
            Cancel
          </Button>
          <Button className="!border-transparent !bg-mid !text-white !shadow-sm hover:!bg-green" disabled={!f.name.trim() || !f.phone.trim()} onClick={trimOnClick}>
            {init ? "Save changes" : "Add distributor"}
          </Button>
        </Box>
      </Box>
    </Box>);
    function stopPropagationOnClick(e: MouseEvent<HTMLDivElement>) {
        return e.stopPropagation();
    }
    function setOnChange(e: ChangeEvent<HTMLInputElement>) {
        return set({ name: e.target.value });
    }
    function setOnChange2(e: ChangeEvent<HTMLInputElement>) {
        return set({ contactPerson: e.target.value });
    }
    function setOnChange3(e: ChangeEvent<HTMLInputElement>) {
        return set({ phone: e.target.value });
    }
    function setOnChange4(e: ChangeEvent<HTMLInputElement>) {
        return set({ email: e.target.value });
    }
    function setOnChange5(e: ChangeEvent<HTMLInputElement>) {
        return set({ gstin: e.target.value.toUpperCase() });
    }
    function setOnChange6(e: ChangeEvent<HTMLInputElement>) {
        return set({ dlNo: e.target.value.toUpperCase() });
    }
    function setOnChange7(e: ChangeEvent<HTMLInputElement>) {
        return set({ address: e.target.value });
    }
    function setOnChange8(e: ChangeEvent<HTMLInputElement>) {
        return set({ city: e.target.value });
    }
    function setOnChange9(e: ChangeEvent<HTMLInputElement>) {
        return set({ state: e.target.value });
    }
    function setOnChange10(e: ChangeEvent<HTMLSelectElement>) {
        return set({ paymentTerms: e.target.value });
    }
    function setOnChange11(e: ChangeEvent<HTMLInputElement>) {
        return set({ outstanding: Number(e.target.value) || 0 });
    }
    function setOnClick() {
        return set({ active: !(f.active !== false) });
    }
    function trimOnClick() {
        if (f.gstin.trim() && !isValidGstin(f.gstin)) {
            showFault("Enter a valid GSTIN");
            return;
        }
        onSave(f);
    }
}
