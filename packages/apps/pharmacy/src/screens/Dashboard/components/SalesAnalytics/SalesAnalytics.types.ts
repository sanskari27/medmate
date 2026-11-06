import type { InvProduct, Sale } from "@/utils";

export type SalesAnalyticsProps = {
  sales: Sale[];
  inventory: InvProduct[];
  now: number;
  onlineRev: number;
  offlineRev: number;
  isHospital: boolean;
};
