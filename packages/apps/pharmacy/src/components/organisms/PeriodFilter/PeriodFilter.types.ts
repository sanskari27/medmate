import type { ReactNode } from "react";

export type PMode = "today" | "month" | "year" | "fy" | "custom" | "all";

export type PeriodWindow = {
  node: ReactNode;
  inWindow: (timestamp: number) => boolean;
  label: string;
  start: number;
  end: number;
  mode: PMode;
};
