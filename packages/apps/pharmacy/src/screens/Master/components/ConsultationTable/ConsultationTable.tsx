import { when } from "@/screens/Master/components/when";
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

export function ConsultationTable({
  rows,
  onHandled,
}: {
  rows: Booking[];
  onHandled: (id: number) => void;
}) {
  return (
    <Table
      columns={["When", "Name", "Phone", "Area", "Note", "Status", ""]}
      empty="No consultation bookings yet."
    >
      {rows.map((row) => (
        <tr key={row.id}>
          <td>{when(row.at)}</td>
          <td>{row.name}</td>
          <td>{row.phone}</td>
          <td>{row.area || "—"}</td>
          <td>{row.note || "—"}</td>
          <td>
            <span className="pd-pill">{row.status}</span>
          </td>
          <td>
            {row.status === "open" && (
              <button className="pd-btn pd-btn-sm" onClick={() => onHandled(row.id)}>
                Mark handled
              </button>
            )}
          </td>
        </tr>
      ))}
    </Table>
  );
}
