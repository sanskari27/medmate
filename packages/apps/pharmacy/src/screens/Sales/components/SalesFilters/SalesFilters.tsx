import type { ChangeEvent } from "react";
import { Box } from "@/components/atoms/Box";
import { Input } from "@/components/atoms/Input";
import { Select } from "@/components/atoms/Select";
import { Stack } from "@/components/atoms/Stack";
import { IconSearch } from "@/components/atoms/Icon";
import { PAY_LABEL, STATUS_LABEL, type Channel, type OrderStatus, type PayMode } from "@/utils";
import type { PaidFilter } from "../../Sales.types";
import type { SalesFiltersProps } from "./SalesFilters.types";

const PAY_MODES: PayMode[] = ["cash", "upi", "card", "cod"];
const STATUSES: OrderStatus[] = ["new", "accepted", "packed", "out", "delivered", "completed"];

export function SalesFilters(props: SalesFiltersProps) {
  function changeSearch(event: ChangeEvent<HTMLInputElement>) {
    props.onSearch(event.target.value);
  }
  function changeChannel(event: ChangeEvent<HTMLSelectElement>) {
    props.onChannel(event.target.value as "all" | Channel);
  }
  function changePay(event: ChangeEvent<HTMLSelectElement>) {
    props.onPayMode(event.target.value as "all" | PayMode);
  }
  function changeStatus(event: ChangeEvent<HTMLSelectElement>) {
    props.onStatus(event.target.value as "all" | OrderStatus);
  }
  function changePaid(event: ChangeEvent<HTMLSelectElement>) {
    props.onPaid(event.target.value as PaidFilter);
  }
  function renderPay(mode: PayMode) {
    return { value: String(mode), label: String(PAY_LABEL[mode]) };
  }
  function renderStatus(status: OrderStatus) {
    return { value: String(status), label: String(STATUS_LABEL[status]) };
  }
  return (
    <Stack direction="row" align="center" wrap gap={2} className="mb-4">
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
          placeholder="Invoice, customer, phone…"
          value={props.searchQuery}
          onChange={changeSearch}
          className="py-0"
        />
      </Stack>
      <Select className="w-[130px]" value={props.channel} onChange={changeChannel} options={[{ value: "all", label: "All channels" }, { value: "online", label: "Online" }, { value: "offline", label: "Counter" }]} />
      <Select className="w-[120px]" value={props.payMode} onChange={changePay} options={[{ value: "all", label: "All payments" }, ...PAY_MODES.map(renderPay)]} />
      <Select className="w-[130px]" value={props.status} onChange={changeStatus} options={[{ value: "all", label: "All statuses" }, ...STATUSES.map(renderStatus)]} />
      <Select className="w-[120px]" value={props.paid} onChange={changePaid} options={[{ value: "all", label: "Paid + unpaid" }, { value: "paid", label: "Paid only" }, { value: "unpaid", label: "Unpaid only" }]} />
    </Stack>
  );
}
