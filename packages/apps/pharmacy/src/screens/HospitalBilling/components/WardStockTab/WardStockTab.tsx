import type { Ward, WardStockRow } from "@/utils";
import {
  Box,
  Select,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeaderCell,
  TableRow,
  Text,
} from "@/components/atoms";
import { TableFooter } from "@/components/molecules/DataTable";
import { cn } from "@/utils/className";
import type { ChangeEvent } from "react";
import { useState } from "react";
import { useAppSelector } from "@/hooks";
import { inr } from "@/utils";
import { wardOnHand } from "@/utils/calculations/hospitalAccount";
import { useCreditPrice } from "@/screens/HospitalBilling/hooks/useCreditPrice";
export function WardStockTab() {
  const wardSupplies = useAppSelector((state) => state.hospital.wardSupplies);
  const wards = useAppSelector((state) => state.hospital.wards);
  const cp = useCreditPrice();
  const [selectedWard, setSelectedWard] = useState("all");
  const rows = wardOnHand(wardSupplies, cp, selectedWard === "all" ? undefined : selectedWard);
  const totalVal = rows.reduce((a, r) => a + r.value, 0);
  return (
    <>
      <Box className={cn("!mb-4 !flex !flex-wrap !items-center !gap-2.5", "!mb-3.5")}>
        <Select
          className=""
          value={selectedWard}
          onChange={changeSelectedWard}
          options={[{ value: "all", label: "All wards" }, ...wards.map(renderWard)]}
        />
        <Box className="!flex-1" />
        <Text className={cn("!text-muted", "!text-[13px]")} as="span">
          Stock currently held in wards (valued at credit price)
        </Text>
      </Box>
      <Box className="!flex !flex-col !rounded-md !border !border-line !bg-paper !shadow-sm">
        <Box className="!overflow-x-auto">
          <Table className="!w-full !border-separate !border-spacing-0 !text-[13px] [&_th]:!sticky [&_th]:!top-0 [&_th]:!border-b [&_th]:!border-line [&_th]:!bg-wash-2 [&_th]:!px-3.5 [&_th]:!py-[11px] [&_th]:!text-left [&_th]:!text-[10.5px] [&_th]:!font-bold [&_th]:!uppercase [&_th]:!tracking-[0.07em] [&_th]:!whitespace-nowrap [&_th]:!text-muted [&_td]:!border-b [&_td]:!border-line [&_td]:!px-3.5 [&_td]:!py-[11px] [&_td]:!align-middle [&_td]:!text-ink-2 [&_tr]:!border-0 [&_tbody_tr:hover]:!bg-wash-2 [&_tbody_tr:last-child_td]:!border-b-0">
            <TableHead>
              <TableRow>
                <TableHeaderCell>Ward</TableHeaderCell>
                <TableHeaderCell>Medicine</TableHeaderCell>
                <TableHeaderCell className="text-right tabular-nums font-semibold text-ink">
                  On hand
                </TableHeaderCell>
                <TableHeaderCell className="text-right tabular-nums font-semibold text-ink">
                  Credit price
                </TableHeaderCell>
                <TableHeaderCell className="text-right tabular-nums font-semibold text-ink">
                  Value
                </TableHeaderCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {rows.map(renderRow)}
              {rows.length === 0 && (
                <TableRow>
                  <TableCell colSpan={5}>
                    <Box className="!px-5 !py-9 !text-center !text-muted [&_h3]:!mb-[5px] [&_h3]:!text-[15px] [&_h3]:!font-bold [&_h3]:!text-ink">
                      No ward stock on hand.
                    </Box>
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
          {rows.length > 0 && (
            <TableFooter className="flex items-center justify-between">
              <Text>Total ward stock value</Text>
              <Text className="tabular-nums">{inr(totalVal)}</Text>
            </TableFooter>
          )}
        </Box>
      </Box>
    </>
  );
  function changeSelectedWard(event: ChangeEvent<HTMLSelectElement>) {
    return setSelectedWard(event.target.value);
  }
  function renderWard(x: Ward) {
    return { value: String(x.id), label: String(x.name) };
  }
  function renderRow(r: WardStockRow) {
    return (
      <TableRow key={r.wardId + r.productId}>
        <TableCell>{r.wardName}</TableCell>
        <TableCell>{r.name}</TableCell>
        <TableCell className={cn("text-right tabular-nums font-semibold text-ink", "!font-bold")}>
          {r.qty}
        </TableCell>
        <TableCell className="text-right tabular-nums font-semibold text-ink">
          {inr(r.price)}
        </TableCell>
        <TableCell
          className={cn("text-right tabular-nums font-semibold text-ink", "!font-extrabold")}
        >
          {inr(r.value)}
        </TableCell>
      </TableRow>
    );
  }
}
