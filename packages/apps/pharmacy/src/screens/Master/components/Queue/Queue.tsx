import { Table } from "@/screens/Master/components/Table";

type Seats = { included: number | null; extra: number; inUse: number; limit: number | null };

type Kyc = {
  gstin: string;
  pan: string;
  dlNo: string;
  fssai: string;
  pharmacist?: string;
  bank?: { bankName?: string; accountNumber?: string; ifsc?: string } | null;
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

export function Queue({
  rows,
  empty,
  columns,
  cells,
  onOpen,
}: {
  rows: Row[];
  empty: string;
  columns: string[];
  cells: (row: Row) => string[];
  onOpen: (id: string) => void;
}) {
  return (
    <Table columns={columns} empty={empty}>
      {rows.map((row) => (
        <tr key={row.id} onClick={() => onOpen(row.id)} style={{ cursor: "pointer" }}>
          {cells(row).map((cell, index) => (
            <td key={index}>{cell}</td>
          ))}
        </tr>
      ))}
    </Table>
  );
}
