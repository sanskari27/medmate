import type { hospitalAging } from "@/utils/calculations/hospitalAccount";

type Tab = "overview" | "issue" | "stock" | "account" | "prices";

export type OverviewTabProps = {
  outstanding: number;
  supplied: number;
  returns: number;
  received: number;
  aging: ReturnType<typeof hospitalAging>;
  goTab: (t: Tab) => void;
  onNewIssue: () => void;
  onRecordPayment: () => void;
  onRemind: () => void;
};
