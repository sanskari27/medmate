import type { BillingCycle, Plan } from "@/utils";

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

export type RequestTableProps = {
  requests: RequestRow[];
  onOpen: (request: RequestRow) => void;
};
