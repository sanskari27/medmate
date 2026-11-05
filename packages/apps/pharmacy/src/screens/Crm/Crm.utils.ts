import { computeInvoice, custKeyOf, smsLink, waLink, type Sale } from "@/utils";
import {
  SEGMENTS,
  TIERS,
  attributedSales,
  type Campaign,
  type Feedback,
  type Patient,
  type PatientMeta,
  type Segment,
} from "@/utils/calculations/crm";
import type { PatientProfileForm } from "./Crm.types";

export function creditCustomerKeys(sales: Sale[], payments: { custKey: string }[]) {
  const keys = new Set<string>();
  for (const sale of sales) {
    if (sale.status !== "cancelled" && sale.payMode === "credit")
      keys.add(custKeyOf(sale.customer));
  }
  for (const payment of payments) keys.add(payment.custKey);
  return keys;
}

export function redeemedPointsByCustomer(redemptions: { custKey: string; points: number }[]) {
  const totals = new Map<string, number>();
  for (const redemption of redemptions) {
    totals.set(redemption.custKey, (totals.get(redemption.custKey) ?? 0) + redemption.points);
  }
  return totals;
}

export function availablePoints(patient: Patient, redeemedBy: Map<string, number>) {
  return Math.max(0, patient.points - (redeemedBy.get(patient.key) ?? 0));
}

export function outstandingPoints(patients: Patient[], redeemedBy: Map<string, number>) {
  return patients.reduce(function sum(total, patient) {
    return total + availablePoints(patient, redeemedBy);
  }, 0);
}

export function activePatientCount(patients: Patient[]) {
  return patients.filter(function recent(patient) {
    return patient.daysSince <= 30;
  }).length;
}

export function chronicPatientCount(patients: Patient[]) {
  return patients.filter(function chronic(patient) {
    return patient.chronic;
  }).length;
}

export function filterPatients(patients: Patient[], segment: Segment | "all", query: string) {
  const needle = query.trim().toLowerCase();
  return patients.filter(function match(patient) {
    const segmentMatch = segment === "all" || patient.segments.includes(segment);
    const text = `${patient.name} ${patient.phone}`.toLowerCase();
    return segmentMatch && (!needle || text.includes(needle));
  });
}

export function segmentCounts(patients: Patient[]) {
  return SEGMENTS.map(function countSegment(segment) {
    const count = patients.filter(function inSegment(patient) {
      return patient.segments.includes(segment.key);
    }).length;
    return { segment, count };
  });
}

export function segmentMemberCount(patients: Patient[], segment: Segment) {
  return patients.filter(function inSegment(patient) {
    return patient.segments.includes(segment);
  }).length;
}

export function feedbackScore(feedbacks: Feedback[]) {
  const average = feedbacks.length
    ? feedbacks.reduce(function sum(total, item) {
        return total + item.rating;
      }, 0) / feedbacks.length
    : 0;
  const promoters = feedbacks.filter(function promoter(item) {
    return (item.nps ?? 0) >= 9;
  }).length;
  const detractors = feedbacks.filter(function detractor(item) {
    return (item.nps ?? 0) <= 6;
  }).length;
  const nps = feedbacks.length
    ? Math.round(((promoters - detractors) / feedbacks.length) * 100)
    : 0;
  return { average, promoters, detractors, nps };
}

export function clampNps(value: string) {
  return Math.max(0, Math.min(10, Number(value) || 0));
}

export function campaignMessage(pharmacyName: string, offer: string, custom: string) {
  const fallback =
    `Hi! This is ${pharmacyName}. ` +
    (offer ? `${offer}. ` : "") +
    "Visit us or reply to order your medicines. Stay healthy!";
  return custom || fallback;
}

export function campaignRecipients(patients: Patient[], segment: Segment | "all") {
  return patients.filter(function match(patient) {
    return (segment === "all" || patient.segments.includes(segment)) && Boolean(patient.phone);
  });
}

export function loyaltyRanking(patients: Patient[], redeemedBy: Map<string, number>) {
  return [...patients].sort(function byPoints(left, right) {
    return availablePoints(right, redeemedBy) - availablePoints(left, redeemedBy);
  });
}

export function tierMemberCount(patients: Patient[], tier: string) {
  return patients.filter(function match(patient) {
    return patient.tier === tier;
  }).length;
}

export function averageLifetimeValue(patients: Patient[]) {
  if (!patients.length) return 0;
  return (
    patients.reduce(function sum(total, patient) {
      return total + patient.spent;
    }, 0) / patients.length
  );
}

export function retentionPercent(patients: Patient[]) {
  if (!patients.length) return 0;
  const repeat = patients.filter(function repeatBuyer(patient) {
    return patient.orders > 1;
  }).length;
  return Math.round((repeat / patients.length) * 100);
}

export function campaignRevenue(campaigns: Campaign[], patients: Patient[], sales: Sale[]) {
  return campaigns.reduce(function sum(total, campaign) {
    return total + attributedSales(campaign, patients, sales);
  }, 0);
}

export function topPatientsByRfm(patients: Patient[]) {
  return [...patients]
    .sort(function byScore(left, right) {
      return right.rfm.score - left.rfm.score;
    })
    .slice(0, 10);
}

export function openWhatsApp(phone: string, text: string) {
  if (!phone) return;
  window.open(waLink(phone, text), "_blank");
}

export function openSms(phone: string, text: string) {
  if (!phone) return;
  window.open(smsLink(phone, text), "_blank");
}

export function patientInitials(name: string) {
  return name
    .split(" ")
    .filter(Boolean)
    .map(function initial(word) {
      return word[0] ?? "";
    })
    .slice(0, 2)
    .join("")
    .toUpperCase();
}

export function patientProfileForm(meta: PatientMeta | undefined): PatientProfileForm {
  return {
    age: meta?.age?.toString() ?? "",
    gender: meta?.gender ?? "",
    bloodGroup: meta?.bloodGroup ?? "",
    dob: meta?.dob ?? "",
    address: meta?.address ?? "",
    conditions: (meta?.conditions ?? []).join(", "),
    allergies: (meta?.allergies ?? []).join(", "),
    note: meta?.note ?? "",
    consent: meta?.consent ?? false,
  };
}

function commaList(value: string) {
  return value
    .split(",")
    .map(function trim(part) {
      return part.trim();
    })
    .filter(Boolean);
}

export function patientMetaFromForm(form: PatientProfileForm): PatientMeta {
  return {
    age: form.age ? Number(form.age) : undefined,
    gender: form.gender || undefined,
    bloodGroup: form.bloodGroup || undefined,
    dob: form.dob || undefined,
    address: form.address.trim() || undefined,
    conditions: commaList(form.conditions),
    allergies: commaList(form.allergies),
    note: form.note.trim() || undefined,
    consent: form.consent,
  };
}

export function loyaltyTierProgress(patient: Patient) {
  const current = TIERS.find(function match(tier) {
    return tier.tier === patient.tier;
  });
  const currentMin = current?.min ?? 0;
  const next = [...TIERS]
    .filter(function higher(tier) {
      return tier.min > patient.points;
    })
    .sort(function byMin(left, right) {
      return left.min - right.min;
    })[0];
  const progress = next
    ? Math.min(100, Math.max(0, ((patient.points - currentMin) / (next.min - currentMin)) * 100))
    : 100;
  return { next, progress };
}

export function patientPurchases(sales: Sale[], key: string) {
  return sales
    .filter(function match(sale) {
      return sale.status !== "cancelled" && custKeyOf(sale.customer) === key;
    })
    .sort(function newest(left, right) {
      return right.createdAt - left.createdAt;
    });
}

export function sparklineGeometry(data: number[], width = 220, height = 40) {
  const max = Math.max(...data, 1);
  const min = Math.min(...data, 0);
  const range = max - min || 1;
  const points = data.map(function point(value, index) {
    return {
      x: (index / (data.length - 1)) * width,
      y: height - 3 - ((value - min) / range) * (height - 8),
    };
  });
  const line = `M ${points
    .map(function pair(point) {
      return `${point.x},${point.y}`;
    })
    .join(" L ")}`;
  return { width, height, line, points };
}

export function barShare(count: number, max: number) {
  return max ? (count / max) * 100 : 0;
}

export function salePayable(sale: Sale) {
  return computeInvoice(sale.items, sale.discount).payable;
}

export function saleItemCount(sale: Sale) {
  return sale.items.reduce(function sum(total, item) {
    return total + item.qty;
  }, 0);
}

export function spendSeries(sales: Sale[]) {
  return [...sales].reverse().map(salePayable);
}
