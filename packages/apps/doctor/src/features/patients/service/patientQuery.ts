import type { ListPatientsArgs } from "@/services/api/api";
import type { PatientFilter, PatientSort, PatientStatus } from "@/types";

/**
 * The query the clinic API expects.
 *
 * `status=all` and an empty search are left out rather than sent empty, so
 * the API applies no filter for them. `due` is sent as it stands, because
 * `due=false` selects the patients with nothing owed.
 */
export function patientQuery(filter: PatientFilter, page = 1, size = 25): ListPatientsArgs {
  const query: ListPatientsArgs = { page, size };
  if (filter.sort) query.sort = filter.sort;
  const q = filter.q?.trim();
  if (q) query.q = q;
  if (filter.status && filter.status !== "all") query.status = filter.status;
  if (filter.due !== undefined) query.due = filter.due ? "true" : "false";
  return query;
}

/** The query parameters a link to the patient list carries. */
export function filterParams(filter: PatientFilter): Record<string, string> {
  const params: Record<string, string> = {};
  if (filter.q) params.q = filter.q;
  if (filter.status && filter.status !== "all") params.status = filter.status;
  if (filter.due !== undefined) params.due = filter.due ? "true" : "false";
  if (filter.sort) params.sort = filter.sort;
  return params;
}

/** The filter a link to the patient list carries. */
export function filterFromParams(params: URLSearchParams): PatientFilter {
  const status = params.get("status");
  const due = params.get("due");
  const sort = params.get("sort");
  const filter: PatientFilter = {
    q: params.get("q") ?? undefined,
    status: status && status !== "all" ? (status as PatientStatus) : undefined,
    due: due === null ? undefined : due === "true",
    sort: sort === "name" || sort === "last-seen" ? (sort as PatientSort) : undefined,
  };
  return filter;
}
