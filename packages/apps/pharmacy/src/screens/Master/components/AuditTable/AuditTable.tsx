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

export function AuditTable({ rows }: { rows: AuditRow[] }) {
  return (
    <Table columns={["When", "Pharmacy", "Action", "Reason", "By"]} empty="No master changes yet.">
      {rows.map((row, index) => (
        <tr key={row.at + index}>
          <td>{when(row.at)}</td>
          <td>{row.pharmacyName || row.pharmacyId}</td>
          <td>{row.action}</td>
          <td>{row.reason || "—"}</td>
          <td>{row.phone}</td>
        </tr>
      ))}
    </Table>
  );
}
