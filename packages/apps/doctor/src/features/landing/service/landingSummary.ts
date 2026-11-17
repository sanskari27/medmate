import type { ClinicGrant, ClinicPatient, ClinicRole, PatientStatus } from "@/types";

export type LandingFilter = {
  q?: string;
  status?: PatientStatus;
  due?: boolean;
};

export type LandingStat = {
  label: string;
  value: string;
  filter?: LandingFilter;
};

export type LandingSummary = {
  title: string;
  subtitle: string;
  stats: LandingStat[];
};

export const BILLING_GRANT: ClinicGrant = "clinic:billing:read";

/** The query parameters a landing stat links to. */
export function filterParams(filter: LandingFilter): Record<string, string> {
  const params: Record<string, string> = {};
  if (filter.status) params.status = filter.status;
  if (filter.due) params.due = "true";
  if (filter.q) params.q = filter.q;
  return params;
}

export function holds(grants: ClinicGrant[] | undefined, grant: ClinicGrant): boolean {
  return Array.isArray(grants) && grants.includes(grant);
}

export function money(value: number | undefined): string {
  return `₹${Number(value ?? 0).toLocaleString("en-IN")}`;
}

function countByStatus(items: ClinicPatient[], status: PatientStatus): number {
  return items.filter((item) => item.status === status).length;
}

/**
 * The landing screen for a role.
 *
 * Every amount is gated on the billing grant: a role without
 * `clinic:billing:read` must not see money anywhere, including in a total.
 */
export function buildLandingSummary(
  role: ClinicRole,
  items: ClinicPatient[],
  grants: ClinicGrant[] | undefined,
): LandingSummary {
  const waiting = countByStatus(items, "waiting");
  const withDoctor = countByStatus(items, "with-doctor");
  const seen = countByStatus(items, "seen");
  const canSeeMoney = holds(grants, BILLING_GRANT);
  const toCollect = canSeeMoney
    ? items.reduce((total, item) => total + Number(item.due ?? 0), 0)
    : null;

  // An amount is only ever shown to a role that holds the billing grant.
  const amountDue: LandingStat[] =
    toCollect === null ? [] : [{ label: "Amount due", value: money(toCollect), filter: { due: true } }];

  switch (role) {
    case "doctor":
      return {
        title: "Your patients",
        subtitle: "The patients assigned to you. Emergencies first.",
        stats: [
          { label: "Waiting", value: String(waiting), filter: { status: "waiting" } },
          { label: "With doctor", value: String(withDoctor), filter: { status: "with-doctor" } },
          { label: "Seen", value: String(seen), filter: { status: "seen" } },
          ...amountDue,
        ],
      };
    case "nurse":
      return {
        title: "Patients needing you",
        subtitle: "Record vitals, then route them to the right doctor.",
        stats: [
          { label: "Needing attention", value: String(waiting + withDoctor), filter: { status: "waiting" } },
          { label: "Waiting", value: String(waiting), filter: { status: "waiting" } },
          { label: "With doctor", value: String(withDoctor), filter: { status: "with-doctor" } },
          ...amountDue,
        ],
      };
    case "front_desk":
      return {
        title: "At the desk",
        subtitle: "Who is checking out, and what still needs collecting.",
        stats: [
          { label: "Waiting", value: String(waiting), filter: { status: "waiting" } },
          { label: "With doctor", value: String(withDoctor), filter: { status: "with-doctor" } },
          { label: "Seen", value: String(seen), filter: { status: "seen" } },
          ...amountDue,
        ],
      };
    case "admin":
      return {
        title: "The clinic today",
        subtitle: "Money and exceptions before the day closes.",
        stats: [
          { label: "Clinic patients", value: String(items.length) },
          { label: "Waiting", value: String(waiting), filter: { status: "waiting" } },
          { label: "With doctor", value: String(withDoctor), filter: { status: "with-doctor" } },
          { label: "Seen", value: String(seen), filter: { status: "seen" } },
          ...amountDue,
        ],
      };
    case "owner":
    default:
      return {
        title: "Your clinic today",
        subtitle: "Money, exceptions and who is waiting.",
        stats: [
          { label: "Patients", value: String(items.length) },
          { label: "Waiting", value: String(waiting), filter: { status: "waiting" } },
          { label: "With doctor", value: String(withDoctor), filter: { status: "with-doctor" } },
          ...amountDue,
        ],
      };
  }
}
