import type { Prescription } from "@/utils";

export type RxViewProps = {
  rx: Prescription;
  compact?: boolean;
  className?: string;
};
