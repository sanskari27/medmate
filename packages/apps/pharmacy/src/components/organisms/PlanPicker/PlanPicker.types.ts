import type { BillingCycle, Plan, PlanInfo } from "@/utils";

export type PlanRequestKind = "plan" | "renewal";

export type PlanCardProps = {
  plan: PlanInfo;
  cycle: BillingCycle;
  current?: boolean;
  onRequest: (plan: Plan, cycle: BillingCycle, kind: PlanRequestKind) => void;
  className?: string;
};

export type PlanPickerProps = {
  plans?: PlanInfo[];
  cycle: BillingCycle;
  currentPlan?: Plan;
  currentCycle?: BillingCycle;
  onRequest: (plan: Plan, cycle: BillingCycle, kind: PlanRequestKind) => void;
  className?: string;
};
