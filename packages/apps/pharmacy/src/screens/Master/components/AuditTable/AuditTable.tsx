import type { AuditTableProps } from "./AuditTable.types";
import { TableCell, TableRow } from "@/components/atoms";
import { when } from "@/screens/Master/utils/when";
import { Table } from "@/screens/Master/components/Table";
type AuditRow = {
    phone: string;
    pharmacyId: string;
    pharmacyName: string;
    action: string;
    before: unknown;
    after: unknown;
    reason: string;
    at: string;
};
export function AuditTable({ rows }: AuditTableProps) {
    return (<Table columns={["When", "Pharmacy", "Action", "Reason", "By"]} empty="No master changes yet.">
      {rows.map(renderRow)}
    </Table>);
    function renderRow(row: AuditRow, index: number) {
        return (<TableRow key={row.at + index}>
          <TableCell>{when(row.at)}</TableCell>
          <TableCell>{row.pharmacyName || row.pharmacyId}</TableCell>
          <TableCell>{row.action}</TableCell>
          <TableCell>{row.reason || "—"}</TableCell>
          <TableCell>{row.phone}</TableCell>
        </TableRow>);
    }
}
