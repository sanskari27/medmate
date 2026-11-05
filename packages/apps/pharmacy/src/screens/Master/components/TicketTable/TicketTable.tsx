import { Table } from "@/screens/Master/components/Table";

type Ticket = {
  id: string;
  subject: string;
  status: string;
  pharmacyId?: string;
  pharmacyName?: string;
  category?: string;
};

export function TicketTable({
  tickets,
  onResolve,
}: {
  tickets: Ticket[];
  onResolve: (ticket: Ticket) => void;
}) {
  return (
    <Table columns={["Pharmacy", "Ticket", "Status", ""]} empty="No open tickets.">
      {tickets.map((ticket) => (
        <tr key={ticket.pharmacyId + ticket.id}>
          <td>{ticket.pharmacyName}</td>
          <td>{ticket.subject}</td>
          <td>
            <span className="pd-pill">{ticket.status}</span>
          </td>
          <td>
            <button className="pd-btn pd-btn-sm" onClick={() => onResolve(ticket)}>
              Resolve
            </button>
          </td>
        </tr>
      ))}
    </Table>
  );
}
