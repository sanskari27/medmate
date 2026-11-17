import type { ClinicGrant, ClinicRole, PatientFilter } from "@/types";

export type LandingStat = {
  label: string;
  value: string;
  filter?: PatientFilter;
};

export type LandingSummary = {
  title: string;
  subtitle: string;
  stats: LandingStat[];
};

/** The counts the patient list reports for the whole clinic. */
export type LandingCounts = {
  totalPatients: number;
  waitingCount: number;
  withDoctorCount: number;
  seenCount: number;
  amountDue: number;
};

export const BILLING_GRANT: ClinicGrant = "clinic:billing:read";

export function holds(grants: ClinicGrant[] | undefined, grant: ClinicGrant): boolean {
  return Array.isArray(grants) && grants.includes(grant);
}

export function money(value: number | undefined): string {
  return `₹${Number(value ?? 0).toLocaleString("en-IN")}`;
}

/**
 * The landing screen for a role.
 *
 * Every amount is gated on the billing grant: a role without
 * `clinic:billing:read` must not see money anywhere, including in a total.
 */
export function buildLandingSummary(
  role: ClinicRole,
  counts: LandingCounts,
  grants: ClinicGrant[] | undefined,
): LandingSummary {
  const canSeeMoney = holds(grants, BILLING_GRANT);
  const amountDue: LandingStat[] = canSeeMoney
    ? [{ label: "Amount due", value: money(counts.amountDue), filter: { due: true } }]
    : [];

  switch (role) {
    case "doctor":
      return {
        title: "Your patients",
        subtitle: "The patients of the clinic, and who is waiting for you.",
        stats: [
          { label: "Patients", value: String(counts.totalPatients) },
          { label: "Waiting", value: String(counts.waitingCount), filter: { status: "waiting" } },
          {
            label: "With doctor",
            value: String(counts.withDoctorCount),
            filter: { status: "with-doctor" },
          },
          { label: "Seen", value: String(counts.seenCount), filter: { status: "seen" } },
          ...amountDue,
        ],
      };
    case "nurse":
      return {
        title: "Patients needing you",
        subtitle: "Who is waiting, and who is already with a doctor.",
        stats: [
          {
            label: "Needing attention",
            value: String(counts.waitingCount + counts.withDoctorCount),
            filter: { status: "waiting" },
          },
          { label: "Waiting", value: String(counts.waitingCount), filter: { status: "waiting" } },
          {
            label: "With doctor",
            value: String(counts.withDoctorCount),
            filter: { status: "with-doctor" },
          },
          ...amountDue,
        ],
      };
    case "front_desk":
      return {
        title: "At the desk",
        subtitle: "Who is checking out, and what still needs collecting.",
        stats: [
          { label: "Waiting", value: String(counts.waitingCount), filter: { status: "waiting" } },
          {
            label: "With doctor",
            value: String(counts.withDoctorCount),
            filter: { status: "with-doctor" },
          },
          { label: "Seen", value: String(counts.seenCount), filter: { status: "seen" } },
          ...amountDue,
        ],
      };
    case "admin":
      return {
        title: "The clinic today",
        subtitle: "Money and exceptions before the day closes.",
        stats: [
          { label: "Clinic patients", value: String(counts.totalPatients) },
          { label: "Waiting", value: String(counts.waitingCount), filter: { status: "waiting" } },
          {
            label: "With doctor",
            value: String(counts.withDoctorCount),
            filter: { status: "with-doctor" },
          },
          { label: "Seen", value: String(counts.seenCount), filter: { status: "seen" } },
          ...amountDue,
        ],
      };
    case "owner":
    default:
      return {
        title: "Your clinic today",
        subtitle: "Money, exceptions and who is waiting.",
        stats: [
          { label: "Patients", value: String(counts.totalPatients) },
          { label: "Waiting", value: String(counts.waitingCount), filter: { status: "waiting" } },
          {
            label: "With doctor",
            value: String(counts.withDoctorCount),
            filter: { status: "with-doctor" },
          },
          ...amountDue,
        ],
      };
  }
}
