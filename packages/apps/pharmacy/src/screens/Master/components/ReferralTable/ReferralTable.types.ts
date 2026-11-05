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

export type ReferralTableProps = {
    referrals: Referral[];
    onEarn: (row: Referral) => void;
    onPay: (row: Referral) => void;
};
