import type { RxKind, RxStatus } from "@/utils";

export type RxStatusFilter = RxStatus | "all";
export type RxKindFilter = "all" | RxKind;

export type PrescriptionTimelineEvent = {
  label: string;
  at: number;
  tone: "done" | "bad";
};
