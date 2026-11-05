import { startOfToday } from "@/utils/date";
import type { InvProduct, Prescription, RxStatus } from "@/utils";
import { fmtMins, inr, rxAvailability, rxOverdue, rxTurnaroundMins } from "@/utils";
import type {
  PrescriptionTimelineEvent,
  RxKindFilter,
  RxStatusFilter,
} from "./Prescriptions.types";

const STATUS_TONE = {
  pending: "gold",
  approved: "blue",
  dispensed: "green",
  rejected: "rose",
} as const;

const STATUS_LABEL: Record<RxStatus, string> = {
  pending: "Pending review",
  approved: "Approved",
  dispensed: "Dispensed",
  rejected: "Rejected",
};

const KIND_LABEL: Record<string, string> = {
  digital: "Digital Rx",
  uploaded: "Uploaded",
};

export const REJECT_REASONS = [
  "Prescription illegible — please re-upload a clear photo",
  "Prescriber could not be verified",
  "Prescription expired (older than 6 months)",
  "Medicine not stocked — please contact the store",
];

export function rxStatusTone(status: RxStatus) {
  return STATUS_TONE[status];
}

export function rxStatusLabel(status: RxStatus) {
  return STATUS_LABEL[status];
}

export function rxKindLabel(kind: string) {
  return KIND_LABEL[kind] ?? kind;
}

export function countPrescriptions(prescriptions: Prescription[], status: RxStatus) {
  return prescriptions.filter(function hasStatus(prescription) {
    return prescription.status === status;
  }).length;
}

export function prescriptionQueueMetrics(
  prescriptions: Prescription[],
  inventory: InvProduct[],
  now: number,
) {
  const pending = prescriptions.filter(function isPending(prescription) {
    return prescription.status === "pending";
  });
  const overdue = pending.filter(function isOverdue(prescription) {
    return rxOverdue(prescription, now);
  });
  const approved = prescriptions.filter(function isApproved(prescription) {
    return prescription.status === "approved";
  });
  const dispensed = prescriptions.filter(function isDispensed(prescription) {
    return prescription.status === "dispensed";
  });
  const dayStart = startOfToday(now);
  const dispensedToday = dispensed.filter(function dispensedAfterMidnight(prescription) {
    return (prescription.dispensedAt ?? 0) >= dayStart;
  });
  const dispensedTodayValue = dispensedToday.reduce(function addBill(total, prescription) {
    return total + rxAvailability(prescription, inventory).value;
  }, 0);
  const digital = prescriptions.filter(function isDigital(prescription) {
    return prescription.kind === "digital";
  }).length;
  const turns = dispensed
    .map(function turnaround(prescription) {
      return rxTurnaroundMins(prescription);
    })
    .filter(function knownTurn(minutes): minutes is number {
      return minutes != null;
    });
  const averageTurnaround = turns.length
    ? Math.round(
        turns.reduce(function addMinutes(total, minutes) {
          return total + minutes;
        }, 0) / turns.length,
      )
    : null;
  const byDoctor: Record<string, number> = {};
  prescriptions.forEach(function countDoctor(prescription) {
    if (prescription.doctor && !/illegible/i.test(prescription.doctor)) {
      byDoctor[prescription.doctor] = (byDoctor[prescription.doctor] || 0) + 1;
    }
  });
  const topDoctors = Object.entries(byDoctor)
    .sort(function byVolume(left, right) {
      return right[1] - left[1];
    })
    .slice(0, 4);
  return {
    total: prescriptions.length,
    pending,
    overdue,
    approved,
    dispensed,
    dispensedToday,
    dispensedTodayValue,
    digital,
    uploaded: prescriptions.length - digital,
    averageTurnaround,
    topDoctors,
  };
}

export function digitalSharePercent(digital: number, total: number) {
  return total ? Math.round((digital / total) * 100) : 0;
}

export function slaOnTimePercent(pending: number, overdue: number) {
  return pending ? Math.round(((pending - overdue) / pending) * 100) : 100;
}

export function filterPrescriptions(
  prescriptions: Prescription[],
  status: RxStatusFilter,
  kind: RxKindFilter,
  query: string,
) {
  const needle = query.trim().toLowerCase();
  return prescriptions
    .filter(function matches(prescription) {
      const statusMatch = status === "all" || prescription.status === status;
      const kindMatch = kind === "all" || prescription.kind === kind;
      const text =
        `${prescription.id} ${prescription.patient} ${prescription.doctor}`.toLowerCase();
      return statusMatch && kindMatch && (!needle || text.includes(needle));
    })
    .sort(function byPriority(left, right) {
      if (!!left.urgent !== !!right.urgent) return left.urgent ? -1 : 1;
      if (left.status === "pending" && right.status === "pending")
        return left.uploadedAt - right.uploadedAt;
      return right.uploadedAt - left.uploadedAt;
    });
}

export function shareWidth(count: number, max: number) {
  return max ? (count / max) * 100 : 0;
}

export function prescriptionTimeline(prescription: Prescription): PrescriptionTimelineEvent[] {
  const events: PrescriptionTimelineEvent[] = [
    { label: "Uploaded", at: prescription.uploadedAt, tone: "done" },
  ];
  if (prescription.approvedAt) {
    events.push({
      label: `Approved${prescription.reviewedBy ? ` · ${prescription.reviewedBy}` : ""}`,
      at: prescription.approvedAt,
      tone: "done",
    });
  }
  if (prescription.rejectedAt) {
    events.push({
      label: `Rejected${prescription.reviewedBy ? ` · ${prescription.reviewedBy}` : ""}`,
      at: prescription.rejectedAt,
      tone: "bad",
    });
  }
  if (prescription.dispensedAt) {
    events.push({ label: "Dispensed & billed", at: prescription.dispensedAt, tone: "done" });
  }
  return events;
}

export function readyMessage(prescription: Prescription, billValue: number) {
  return `Hi ${prescription.patient}, your prescription ${prescription.id} at our pharmacy is ready. Est. bill ${inr(billValue)}. — Namma MedMate`;
}

export function rejectedMessage(prescription: Prescription) {
  return `Hi ${prescription.patient}, we couldn't process prescription ${prescription.id}. Reason: ${prescription.rejectReason || "please re-upload a clearer copy"}. — Namma MedMate`;
}

export function notifyMessage(prescription: Prescription, billValue: number) {
  return prescription.status === "rejected"
    ? rejectedMessage(prescription)
    : readyMessage(prescription, billValue);
}

export function turnaroundLabel(minutes: number | null) {
  return fmtMins(minutes);
}
