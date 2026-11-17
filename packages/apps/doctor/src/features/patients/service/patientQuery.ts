import type { PatientSort, PatientStatus } from "@/types";
import type { ListPatientsArgs } from "@/services/api/api";

export type PatientFilter = {
  q?: string;
  status?: PatientStatus | "all";
  due?: boolean;
  sort?: PatientSort;
};

export const ALL_STATUSES: PatientStatus[] = ["waiting", "with-doctor", "seen", "inactive"];

/**
 * The query the clinic API expects.
 *
 * `status=all` and an empty search are omitted rather than sent as empty
 * strings, so the API applies no filter for them.
 */
export function patientQuery(filter: PatientFilter, page = 1, size = 25): ListPatientsArgs {
  const query: ListPatientsArgs = { page, size, sort: filter.sort ?? "name" };
  const q = filter.q?.trim();
  if (q) query.q = q;
  if (filter.status && filter.status !== "all") query.status = filter.status;
  if (filter.due) query.due = "true";
  return query;
}

/** The filter a landing screen stat links to, as URL parameters. */
export function filterParams(filter: LandingFilterLike): Record<string, string> {
  const params: Record<string, string> = {};
  if (filter.status) params.status = filter.status;
  if (filter.due) params.due = "true";
  if (filter.q) params.q = filter.q;
  return params;
}

type LandingFilterLike = { q?: string; status?: PatientStatus; due?: boolean };
