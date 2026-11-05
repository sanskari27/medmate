import type { CreditCustomer, Sale, CreditPayment, PayMode } from "@/utils";

export type KhataModalProps = {
  c: CreditCustomer;
  onClose: () => void;
  sales: Sale[];
  creditPayments: CreditPayment[];
  recordCreditPayment: (p: {
    custKey: string;
    custName: string;
    custPhone: string;
    amount: number;
    mode: PayMode;
    note?: string;
  }) => Promise<unknown>;
  profile: any;
  now: number;
  go: (r: any) => void;
};
