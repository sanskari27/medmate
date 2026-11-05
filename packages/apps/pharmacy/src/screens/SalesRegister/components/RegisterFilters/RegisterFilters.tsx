import type { ChangeEvent } from "react";
import { Box } from "@/components/atoms/Box";
import { Input } from "@/components/atoms/Input";
import { Select } from "@/components/atoms/Select";
import { Stack } from "@/components/atoms/Stack";
import { IconSearch } from "@/components/atoms/Icon";
import { PAY_LABEL, type PayMode } from "@/utils";
import type { RegisterPaid } from "../../SalesRegister.types";

const PAY_MODES: PayMode[] = ["cash", "upi", "card", "cod", "credit", "insurance"];

export type RegisterFiltersProps = {
  payMode: "all" | PayMode;
  paid: RegisterPaid;
  insurer: string;
  ward: string;
  insurers: string[];
  wards: string[];
  searchQuery: string;
  onPayMode: (value: "all" | PayMode) => void;
  onPaid: (value: RegisterPaid) => void;
  onInsurer: (value: string) => void;
  onWard: (value: string) => void;
  onSearch: (value: string) => void;
};

export function RegisterFilters(props: RegisterFiltersProps) {
  function changePay(event: ChangeEvent<HTMLSelectElement>) {
    props.onPayMode(event.target.value as "all" | PayMode);
  }
  function changePaid(event: ChangeEvent<HTMLSelectElement>) {
    props.onPaid(event.target.value as RegisterPaid);
  }
  function changeInsurer(event: ChangeEvent<HTMLSelectElement>) {
    props.onInsurer(event.target.value);
  }
  function changeWard(event: ChangeEvent<HTMLSelectElement>) {
    props.onWard(event.target.value);
  }
  function changeSearch(event: ChangeEvent<HTMLInputElement>) {
    props.onSearch(event.target.value);
  }
  function renderPay(mode: PayMode) {
    return { value: String(mode), label: String(PAY_LABEL[mode]) };
  }
  function renderInsurer(name: string) {
    return { value: String(name), label: String(name) };
  }
  function renderWard(name: string) {
    return { value: String(name), label: String(name) };
  }
  return (
    <Stack direction="row" align="center" wrap gap={2} className="mt-2.5 mb-4">
      <Select value={props.payMode} onChange={changePay} options={[{ value: "all", label: "All payment modes" }, ...PAY_MODES.map(renderPay)]} />
      <Select value={props.paid} onChange={changePaid} options={[{ value: "all", label: "Paid & Unpaid" }, { value: "paid", label: "Paid only" }, { value: "unpaid", label: "Unpaid only" }]} />
      <Select value={props.insurer} onChange={changeInsurer} options={[{ value: "all", label: "All insurers / TPA" }, ...props.insurers.map(renderInsurer)]} />
      <Select value={props.ward} onChange={changeWard} options={[{ value: "all", label: "All wards" }, ...props.wards.map(renderWard)]} />
      <Stack
        direction="row"
        align="center"
        gap={2}
        className="max-w-[360px] min-w-[240px] flex-1 rounded-sm border border-line-2 bg-paper px-3 py-2"
      >
        <Box className="text-green">
          <IconSearch size={17} />
        </Box>
        <Input
          variant="plain"
          placeholder="Invoice, patient, phone…"
          value={props.searchQuery}
          onChange={changeSearch}
          className="py-0"
        />
      </Stack>
    </Stack>
  );
}
