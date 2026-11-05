import type { CreditPayment, PayMode, PharmacyProfile, Sale } from "@/utils";

export type CustomerSort = "spent" | "orders" | "recent";

export type CustomerAccount = {
  key: string;
  name: string;
  phone: string;
  orders: Sale[];
  spent: number;
  units: number;
  online: number;
  offline: number;
  last: number;
  rx: boolean;
};

export type CustomerExportRow = {
  name: string;
  phone: string;
  orders: number;
  units: number;
  online: number;
  offline: number;
  spent: number;
  last: number;
  rx: boolean;
};

export type CreditRepayment = {
  custKey: string;
  custName: string;
  custPhone: string;
  amount: number;
  mode: PayMode;
  note?: string;
};

export type CustomerModalProps = {
  customer: CustomerAccount;
  onClose: () => void;
  onNewSale: () => void;
  sales: Sale[];
  creditPayments: CreditPayment[];
  recordCreditPayment: (payment: CreditRepayment) => Promise<unknown>;
  profile: PharmacyProfile;
};
