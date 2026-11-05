export function earnedReferralTotal(referrals: { status: string; reward: number }[]) {
  return referrals
    .filter(function earned(row) {
      return row.status === "Earned" || row.status === "Paid";
    })
    .reduce(function sum(total, row) {
      return total + row.reward;
    }, 0);
}
