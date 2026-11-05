import type { TicketTableProps } from "./TicketTable.types";
import { Button, TableCell, TableRow, Text } from "@/components/atoms";
import { Table } from "@/screens/Master/components/Table";
type Ticket = {
    id: string;
    subject: string;
    status: string;
    pharmacyId?: string;
    pharmacyName?: string;
    category?: string;
};
export function TicketTable({ tickets, onResolve, }: TicketTableProps) {
    return (<Table columns={["Pharmacy", "Ticket", "Status", ""]} empty="No open tickets.">
      {tickets.map(renderTicket)}
    </Table>);
    function renderTicket(ticket: Ticket) {
        return (<TableRow key={ticket.pharmacyId + ticket.id}>
          <TableCell>{ticket.pharmacyName}</TableCell>
          <TableCell>{ticket.subject}</TableCell>
          <TableCell>
            <Text className="!inline-flex !items-center !gap-1 !whitespace-nowrap !rounded-full !px-[9px] !py-[3px] !text-[11px] !font-bold" as="span">{ticket.status}</Text>
          </TableCell>
          <TableCell>
            <Button className="!h-auto !rounded-xs !px-[11px] !py-1.5 !text-xs" onClick={onResolveOnClick}>
              Resolve
            </Button>
          </TableCell>
        </TableRow>);
        function onResolveOnClick() {
            return onResolve(ticket);
        }
    }
}
