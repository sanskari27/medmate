import type { DistributorModalProps } from "./DistributorModal.types";
import { Box, Button, Heading, Input, Label, Switch, Text } from "@/components/atoms";
import { cn } from "@/utils/className";
import {
  ChevronSelect,
  closeButtonClass,
  fieldClass,
  formGridClass,
  modalBodyClass,
  modalFootClass,
  modalHeadClass,
  modalOverlayClass,
  modalPanelClass,
  span2Class,
} from "@/screens/Purchases/purchaseChrome";
import type { ChangeEvent, MouseEvent } from "react";
import { useState } from "react";
import { useAppDispatch } from "@/hooks";
import { setFormFault } from "@/store/actions/feedback.actions";
import { Supplier, isValidGstin } from "@/utils";
import { faultOf } from "@/utils/validation";
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
export function DistributorModal({ init, onClose, onSave }: DistributorModalProps) {
  const dispatch = useAppDispatch();
  const [draft, setDraft] = useState<Omit<Supplier, "id">>(init ? { ...init } : { ...BLANK_SUP });
  const set = (patch: Partial<typeof draft>) => setDraft((current) => ({ ...current, ...patch }));
  function showFault(error: unknown, fallback = "Save failed") {
    dispatch(
      setFormFault(
        typeof error === "string" ? faultOf(new Error(error), fallback) : faultOf(error, fallback),
      ),
    );
  }
  return (
    <Box className={modalOverlayClass} onClick={onClose}>
      <Box onClick={stopPropagationOnClick} className={cn(modalPanelClass, "!max-w-[640px]")}>
        <Box className={modalHeadClass}>
          <Heading level={3}>{init ? "Edit distributor" : "Add distributor"}</Heading>
          <Button className={closeButtonClass} onClick={onClose} aria-label="Close">
            <IconX size={18} />
          </Button>
        </Box>
        <Box className={modalBodyClass}>
          <Box className={formGridClass}>
            <Box className={cn(fieldClass, span2Class)} data-field="name">
              <Label>Distributor / firm name *</Label>
              <Input
                className=""
                value={draft.name}
                onChange={setOnChange}
                placeholder="e.g. Bengaluru Pharma Distributors"
              />
            </Box>
            <Box className={fieldClass}>
              <Label>Contact person</Label>
              <Input className="" value={draft.contactPerson || ""} onChange={setOnChange2} />
            </Box>
            <Box className={fieldClass} data-field="phone">
              <Label>Phone *</Label>
              <Input className="" value={draft.phone} onChange={setOnChange3} placeholder="+91 …" />
            </Box>
            <Box className={fieldClass} data-field="email">
              <Label>Email</Label>
              <Input className="" value={draft.email || ""} onChange={setOnChange4} />
            </Box>
            <Box className={fieldClass} data-field="gstin">
              <Label>GSTIN</Label>
              <Input
                className="!font-mono"
                value={draft.gstin}
                onChange={setOnChange5}
                placeholder="29ABCDE1234F1Z5"
              />
            </Box>
            <Box className={fieldClass}>
              <Label>Drug licence no.</Label>
              <Input
                className="!font-mono"
                value={draft.dlNo || ""}
                onChange={setOnChange6}
                placeholder="KA-W-…"
              />
            </Box>
            <Box className={cn(fieldClass, span2Class)}>
              <Label>Address</Label>
              <Input className="" value={draft.address || ""} onChange={setOnChange7} />
            </Box>
            <Box className={fieldClass}>
              <Label>City</Label>
              <Input className="" value={draft.city || ""} onChange={setOnChange8} />
            </Box>
            <Box className={fieldClass}>
              <Label>State</Label>
              <Input className="" value={draft.state || ""} onChange={setOnChange9} />
            </Box>
            <Box className={fieldClass}>
              <Label>Payment terms</Label>
              <ChevronSelect
                value={draft.paymentTerms || ""}
                onChange={setOnChange10}
                options={[
                  { value: "Advance", label: "Advance" },
                  { value: "On delivery", label: "On delivery" },
                  { value: "7 days credit", label: "7 days credit" },
                  { value: "15 days credit", label: "15 days credit" },
                  { value: "30 days credit", label: "30 days credit" },
                  { value: "45 days credit", label: "45 days credit" },
                ]}
              />
            </Box>
            <Box className={fieldClass}>
              <Label>Outstanding payable (₹)</Label>
              <Input
                className=""
                type="number"
                value={draft.outstanding ?? 0}
                onChange={setOnChange11}
              />
            </Box>
          </Box>
          <Box className={cn("!flex !items-center !gap-2.5", "!mt-4 !gap-2.5 !items-center")}>
            <Switch
              checked={draft.active !== false}
              label="Toggle active"
              onClick={setOnClick}
              className="!transition-[background-color] !duration-[160ms] after:!bg-white after:!shadow-[0_1px_3px_rgba(0,0,0,0.22)] after:!transition-transform after:!duration-[160ms] after:!ease-[cubic-bezier(0.3,0.7,0.4,1)]"
            />
            <Text className={cn("!text-[13px] !font-semibold")} as="span">
              Active — show in purchases & reorder lists
            </Text>
          </Box>
        </Box>
        <Box className={modalFootClass}>
          <Button variant="ghost" onClick={onClose}>
            Cancel
          </Button>
          <Button disabled={!draft.name.trim() || !draft.phone.trim()} onClick={trimOnClick}>
            {init ? "Save changes" : "Add distributor"}
          </Button>
        </Box>
      </Box>
    </Box>
  );
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
    return set({ active: !(draft.active !== false) });
  }
  function trimOnClick() {
    if (draft.gstin.trim() && !isValidGstin(draft.gstin)) {
      showFault("Enter a valid GSTIN");
      return;
    }
    onSave(draft);
  }
}
