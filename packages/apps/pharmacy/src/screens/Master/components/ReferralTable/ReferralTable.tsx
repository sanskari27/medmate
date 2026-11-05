import type { ReferralTableProps } from "./ReferralTable.types";
import { Button, TableCell, TableRow, Text } from "@/components/atoms";
import { Table } from "@/screens/Master/components/Table";
type Referral = {
  id: string;
  name: string;
  status: string;
  reward: number;
  paidAt?: number;
  paidBy?: string;
  pharmacyId?: string;
  pharmacyName?: string;
};
export function ReferralTable({ referrals, onEarn, onPay }: ReferralTableProps) {
  return (
    <Table columns={["Pharmacy", "Referral", "Status", "Reward", ""]} empty="No referrals.">
      {referrals.map(renderReferral)}
    </Table>
  );
  function renderReferral(referral: Referral) {
    return (
      <TableRow key={(referral.pharmacyId || "") + referral.id}>
        <TableCell>{referral.pharmacyName}</TableCell>
        <TableCell>{referral.name}</TableCell>
        <TableCell>
          <Text
            className="!inline-flex !items-center !gap-1 !whitespace-nowrap !rounded-full !px-[9px] !py-[3px] !text-[11px] !font-bold"
            as="span"
          >
            {referral.status}
          </Text>
        </TableCell>
        <TableCell>₹{referral.reward}</TableCell>
        <TableCell>
          {referral.status !== "Paid" && referral.status !== "Earned" && (
            <Button
              className="!h-auto !rounded-xs !px-[11px] !py-1.5 !text-xs"
              onClick={onEarnOnClick}
            >
              Mark earned
            </Button>
          )}
          {referral.status === "Earned" && (
            <Button
              className="!h-auto !rounded-xs !px-[11px] !py-1.5 !text-xs !border-transparent !bg-mid !text-white !shadow-sm hover:!bg-green"
              onClick={onPayOnClick}
            >
              Mark paid
            </Button>
          )}
          {referral.paidBy && (
            <Text className="!text-muted" as="span">
              Paid by {referral.paidBy}
            </Text>
          )}
        </TableCell>
      </TableRow>
    );
    function onEarnOnClick() {
      return onEarn(referral);
    }
    function onPayOnClick() {
      return onPay(referral);
    }
  }
}
