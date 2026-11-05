type Desk = "dashboard" | "pharmacies" | "kyc" | "subscriptions" | "coupons" | "requests" | "support" | "consultations" | "referrals" | "activity";

export type DashboardProps = {
    counts: Record<string, number>;
    onOpen: (desk: Desk) => void;
};
