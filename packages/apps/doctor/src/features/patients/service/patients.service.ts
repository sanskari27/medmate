import { useAppSelector } from "@/app/store/hooks";
import { useGetMeQuery, useListPatientsQuery } from "@/services/api/api";
import { patientQuery } from "./patientQuery";
import type { PatientListFilters } from "@/types";

const MAX_PAGE_SIZE = 100;
const COUNT_PAGE_SIZE = 1;

/** The patients of the signed-in clinic, with the filters the list screen owns. */
export function usePatients(filters: PatientListFilters = {}) {
  const { session } = useAppSelector((state) => state.auth);
  const me = useGetMeQuery(undefined, { skip: !session });
  const query = useListPatientsQuery(patientQuery(filters, filters.page ?? 1, filters.size ?? 25), {
    skip: !session,
  });

  return {
    patients: query.data?.items ?? [],
    total: query.data?.total ?? 0,
    page: query.data?.page ?? 1,
    size: query.data?.size ?? 25,
    hasClinicalRead: me.data?.grants.includes("clinic:patients:read_clinical") ?? false,
    hasBillingRead: me.data?.grants.includes("clinic:billing:read") ?? false,
    isLoading: query.isLoading,
    isError: query.isError,
    error: query.error,
    refetch: query.refetch,
  };
}

/**
 * The counts the landing screen shows.
 *
 * Every count is the total the patient list reports for that filter, so a
 * clinic with more patients than one page still counts them all. The
 * outstanding amount is the sum of the dues the list returns, and it only
 * exists for an account holding `clinic:billing:read`.
 */
export function usePatientCounts() {
  const { session } = useAppSelector((state) => state.auth);
  const me = useGetMeQuery(undefined, { skip: !session });
  const hasBillingRead = me.data?.grants.includes("clinic:billing:read") ?? false;

  const all = useListPatientsQuery(patientQuery({}, 1, COUNT_PAGE_SIZE), { skip: !session });
  const waiting = useListPatientsQuery(patientQuery({ status: "waiting" }, 1, COUNT_PAGE_SIZE), {
    skip: !session,
  });
  const withDoctor = useListPatientsQuery(
    patientQuery({ status: "with-doctor" }, 1, COUNT_PAGE_SIZE),
    { skip: !session },
  );
  const seen = useListPatientsQuery(patientQuery({ status: "seen" }, 1, COUNT_PAGE_SIZE), {
    skip: !session,
  });
  const owing = useListPatientsQuery(
    patientQuery({ due: true }, 1, MAX_PAGE_SIZE),
    { skip: !session || !hasBillingRead },
  );

  return {
    totalPatients: all.data?.total ?? 0,
    waitingCount: waiting.data?.total ?? 0,
    withDoctorCount: withDoctor.data?.total ?? 0,
    seenCount: seen.data?.total ?? 0,
    owingCount: owing.data?.total ?? 0,
    amountDue: (owing.data?.items ?? []).reduce((sum, item) => sum + Number(item.due ?? 0), 0),
    hasBillingRead,
    isLoading: all.isLoading || waiting.isLoading || withDoctor.isLoading || seen.isLoading,
    isError: all.isError || waiting.isError || withDoctor.isError || seen.isError,
  };
}
