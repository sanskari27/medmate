import type { QueueProps } from "./Queue.types";
import { TableCell, TableRow } from "@/components/atoms";
import { cn } from "@/utils/className";
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
export function Queue({ rows, empty, columns, cells, onOpen, }: QueueProps) {
    return (<Table columns={columns} empty={empty}>
      {rows.map(renderRow)}
    </Table>);
    function renderRow(row: Row) {
        return (<TableRow key={row.id} onClick={onOpenOnClick} className={cn("!cursor-pointer")}>
          {cells(row).map(renderCell)}
        </TableRow>);
        function onOpenOnClick() {
            return onOpen(row.id);
        }
        function renderCell(cell: string, index: number) {
            return (<TableCell key={index}>{cell}</TableCell>);
        }
    }
}
