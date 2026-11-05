import { BillingCycle, Plan } from "@/domain";

import { when } from "./when";
import { Table } from "./Table";

type RequestRow = {
  id: string;
  pharmacyId: string;
  pharmacyName: string;
  phone: string;
  plan: Plan;
  cycle: BillingCycle;
  kind: string;
  createdAt: number;
  status: string;
};

export function RequestTable({
  requests,
  onOpen,
}: {
  requests: RequestRow[];
  onOpen: (request: RequestRow) => void;
}) {
  return (
    <Table
      columns={["Pharmacy", "Plan", "Cycle", "Kind", "Sent", "Status", ""]}
      empty="No requests."
    >
      {requests.map((request) => (
        <tr key={request.pharmacyId + request.id}>
          <td>{request.pharmacyName || request.phone}</td>
          <td>{request.plan}</td>
          <td>{request.cycle}</td>
          <td>{request.kind}</td>
          <td>{when(request.createdAt)}</td>
          <td>{request.status}</td>
          <td>
            {request.status === "open" && (
              <button className="pd-btn pd-btn-sm pd-btn-primary" onClick={() => onOpen(request)}>
                Open
              </button>
            )}
          </td>
        </tr>
      ))}
    </Table>
  );
}
