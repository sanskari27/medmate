import type { ConsultationTableProps } from "./ConsultationTable.types";
import { Button, TableCell, TableRow, Text } from "@/components/atoms";
import { when } from "@/screens/Master/utils/when";
import { Table } from "@/screens/Master/components/Table";
type Booking = {
  id: number;
  name: string;
  phone: string;
  area: string;
  note: string;
  status: string;
  at: string;
};
export function ConsultationTable({ rows, onHandled }: ConsultationTableProps) {
  return (
    <Table
      columns={["When", "Name", "Phone", "Area", "Note", "Status", ""]}
      empty="No consultation bookings yet."
    >
      {rows.map(renderRow)}
    </Table>
  );
  function renderRow(row: Booking) {
    return (
      <TableRow key={row.id}>
        <TableCell>{when(row.at)}</TableCell>
        <TableCell>{row.name}</TableCell>
        <TableCell>{row.phone}</TableCell>
        <TableCell>{row.area || "—"}</TableCell>
        <TableCell>{row.note || "—"}</TableCell>
        <TableCell>
          <Text
            className="!inline-flex !items-center !gap-1 !whitespace-nowrap !rounded-full !px-[9px] !py-[3px] !text-[11px] !font-bold"
            as="span"
          >
            {row.status}
          </Text>
        </TableCell>
        <TableCell>
          {row.status === "open" && (
            <Button
              className="!h-auto !rounded-xs !px-[11px] !py-1.5 !text-xs"
              onClick={onHandledOnClick}
            >
              Mark handled
            </Button>
          )}
        </TableCell>
      </TableRow>
    );
    function onHandledOnClick() {
      return onHandled(row.id);
    }
  }
}
