import type { PharmacyListProps } from "./PharmacyList.types";
import { Box, Input, Select, TableCell, TableRow } from "@/components/atoms";
import { cn } from "@/utils/className";
import type { ChangeEvent } from "react";
import { Plan } from "@/utils";
import { seatText } from "@/screens/Master/utils/seatText";
import { Table } from "@/screens/Master/components/Table";
type Seats = {
  included: number | null;
  extra: number;
  inUse: number;
  limit: number | null;
};
type Kyc = {
  gstin: string;
  pan: string;
  dlNo: string;
  fssai: string;
  pharmacist?: string;
  bank?: {
    bankName?: string;
    accountNumber?: string;
    ifsc?: string;
  } | null;
};
type Row = {
  id: string;
  phone: string;
  name: string;
  city: string;
  plan: string;
  cycle: string;
  status: string;
  renewsOn: string;
  businessType: string;
  seats: Seats;
  kyc: Kyc;
};
const PLANS: Plan[] = ["Essential", "Care", "Growth", "Flagship"];
export function PharmacyList({
  rows,
  q,
  setQ,
  plan,
  setPlan,
  businessType,
  setBusinessType,
  window,
  setWindow,
  onOpen,
}: PharmacyListProps) {
  return (
    <>
      <Box
        className={cn(
          "!flex !flex-col !rounded-md !border !border-line !bg-paper !shadow-sm !flex-1 !p-[18px]",
          "!mb-4 !flex !gap-2 !flex-wrap",
        )}
      >
        <Input
          className=""
          placeholder="Name, phone, or city"
          value={q}
          onChange={setQOnChange}
          aria-label="Search pharmacies"
        />
        <Select
          className=""
          value={plan}
          onChange={setPlanOnChange}
          aria-label="Plan filter"
          options={[{ value: "", label: "Any plan" }, ...PLANS.map(renderPLANS)]}
        />
        <Select
          className=""
          value={businessType}
          onChange={setBusinessTypeOnChange}
          aria-label="Business type filter"
          options={[
            { value: "", label: "Any type" },
            { value: "pharmacy", label: "Retail" },
            { value: "hospital", label: "Hospital" },
          ]}
        />
        <Select
          className=""
          value={window}
          onChange={setWindowOnChange}
          aria-label="Renewal window"
          options={[
            { value: "", label: "Any renewal" },
            { value: "7", label: "Expiring in 7 days" },
            { value: "15", label: "Expiring in 15 days" },
            { value: "30", label: "Expiring in 30 days" },
            { value: "expired", label: "Expired" },
          ]}
        />
      </Box>
      <Table
        columns={["Pharmacy", "Phone", "City", "Plan", "Type", "Renews", "Seats"]}
        empty="No pharmacies match."
      >
        {rows.map(renderRow)}
      </Table>
    </>
  );
  function setQOnChange(e: ChangeEvent<HTMLInputElement>) {
    return setQ(e.target.value);
  }
  function setPlanOnChange(e: ChangeEvent<HTMLSelectElement>) {
    return setPlan(e.target.value);
  }
  function renderPLANS(item: Plan) {
    return { value: String(item), label: String(item) };
  }
  function setBusinessTypeOnChange(e: ChangeEvent<HTMLSelectElement>) {
    return setBusinessType(e.target.value);
  }
  function setWindowOnChange(e: ChangeEvent<HTMLSelectElement>) {
    return setWindow(e.target.value);
  }
  function renderRow(row: Row) {
    return (
      <TableRow key={row.id} onClick={onOpenOnClick} className={cn("!cursor-pointer")}>
        <TableCell>{row.name}</TableCell>
        <TableCell>{row.phone}</TableCell>
        <TableCell>{row.city || "—"}</TableCell>
        <TableCell>
          {row.plan} · {row.cycle}
        </TableCell>
        <TableCell>{row.businessType}</TableCell>
        <TableCell>{row.renewsOn || "—"}</TableCell>
        <TableCell>{seatText(row.seats)}</TableCell>
      </TableRow>
    );
    function onOpenOnClick() {
      return onOpen(row.id);
    }
  }
}
