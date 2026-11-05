import type { Sale } from "@/utils";
import type { usePharma } from "@/hooks";

export type SalesAnalyticsProps = {
  sales: Sale[];
  inventory: ReturnType<typeof usePharma>["inventory"];
  now: number;
  onlineRev: number;
  offlineRev: number;
  isHospital: boolean;
};
