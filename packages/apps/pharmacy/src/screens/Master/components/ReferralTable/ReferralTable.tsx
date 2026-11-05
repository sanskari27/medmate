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

export function ReferralTable({
  referrals,
  onEarn,
  onPay,
}: {
  referrals: Referral[];
  onEarn: (row: Referral) => void;
  onPay: (row: Referral) => void;
}) {
  return (
    <Table columns={["Pharmacy", "Referral", "Status", "Reward", ""]} empty="No referrals.">
      {referrals.map((referral) => (
        <tr key={(referral.pharmacyId || "") + referral.id}>
          <td>{referral.pharmacyName}</td>
          <td>{referral.name}</td>
          <td>
            <span className="pd-pill">{referral.status}</span>
          </td>
          <td>₹{referral.reward}</td>
          <td>
            {referral.status !== "Paid" && referral.status !== "Earned" && (
              <button className="pd-btn pd-btn-sm" onClick={() => onEarn(referral)}>
                Mark earned
              </button>
            )}
            {referral.status === "Earned" && (
              <button className="pd-btn pd-btn-sm pd-btn-primary" onClick={() => onPay(referral)}>
                Mark paid
              </button>
            )}
            {referral.paidBy && <span className="pd-muted">Paid by {referral.paidBy}</span>}
          </td>
        </tr>
      ))}
    </Table>
  );
}
