import type { RequestTableProps } from "./RequestTable.types";
import { Button, TableCell, TableRow } from "@/components/atoms";
import { BillingCycle, Plan } from "@/utils";
import { when } from "@/screens/Master/utils/when";
import { Table } from "@/screens/Master/components/Table";
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
export function RequestTable({ requests, onOpen, }: RequestTableProps) {
    return (<Table columns={["Pharmacy", "Plan", "Cycle", "Kind", "Sent", "Status", ""]} empty="No requests.">
      {requests.map(renderRequest)}
    </Table>);
    function renderRequest(request: RequestRow) {
        return (<TableRow key={request.pharmacyId + request.id}>
          <TableCell>{request.pharmacyName || request.phone}</TableCell>
          <TableCell>{request.plan}</TableCell>
          <TableCell>{request.cycle}</TableCell>
          <TableCell>{request.kind}</TableCell>
          <TableCell>{when(request.createdAt)}</TableCell>
          <TableCell>{request.status}</TableCell>
          <TableCell>
            {request.status === "open" && (<Button className="!h-auto !rounded-xs !px-[11px] !py-1.5 !text-xs !border-transparent !bg-mid !text-white !shadow-sm hover:!bg-green" onClick={onOpenOnClick}>
                Open
              </Button>)}
          </TableCell>
        </TableRow>);
        function onOpenOnClick() {
            return onOpen(request);
        }
    }
}
