import { Box, Button, Heading, Text as TextComponent } from "@/components/ui";
import { Icon } from "@/components/Icon";
import { PatientRow } from "../PatientRow";
import { PatientFilters } from "../PatientFilters";
import { usePatients } from "../../service/patients.service";
import { filterFromParams, filterParams } from "../../service/patientQuery";
import { problemMessage } from "@/services/api";
import { useSearchParams } from "react-router-dom";
import type { PatientListFilters } from "@/types";

const PAGE_SIZE = 25;

export function PatientListPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const filter = filterFromParams(searchParams);
  const page = Number(searchParams.get("page") ?? "1");
  const filters: PatientListFilters = {
    ...filter,
    sort: filter.sort ?? "name",
    page,
    size: PAGE_SIZE,
  };

  const {
    patients,
    total,
    page: currentPage,
    size,
    hasClinicalRead,
    hasBillingRead,
    isLoading,
    isError,
    error,
    refetch,
  } = usePatients(filters);

  const applyFilters = (next: PatientListFilters) => {
    setSearchParams({ ...filterParams(next), page: String(next.page ?? 1) });
  };

  const totalPages = Math.ceil(total / size);

  if (isLoading) {
    return <TextComponent className="text-[13.5px] text-muted">Loading patients</TextComponent>;
  }

  if (isError) {
    return (
      <Box className="rounded-card border border-red-bg bg-red-bg p-4">
        <TextComponent className="text-red font-bold">Error loading patients</TextComponent>
        <TextComponent className="mt-1 text-[13px] text-red">
          {problemMessage(error, "Could not load the patient list")}
        </TextComponent>
        <Button
          type="button"
          variant="secondary"
          size="sm"
          className="mt-3"
          onClick={() => refetch()}
        >
          Retry
        </Button>
      </Box>
    );
  }

  return (
    <Box className="rounded-card border border-line bg-surface">
      <Box className="border-b border-line px-5 py-4">
        <Heading level={2} className="text-[18px] font-bold">
          Patients
        </Heading>
      </Box>

      <PatientFilters filters={filters} onChange={applyFilters} total={total} />

      <Box className="overflow-x-auto">
        {patients.length === 0 ? (
          <Box className="px-6 py-12 text-center">
            <Icon name="users" size={48} className="mx-auto mb-3 text-muted" />
            <TextComponent className="text-[14px] font-bold text-ink mb-1">
              No patients
            </TextComponent>
            <TextComponent className="text-[13px] text-muted max-w-[340px] mx-auto">
              {filters.q || filters.status || filters.due !== undefined
                ? "No patients match this filter. Try adjusting your search."
                : "This clinic has no patients yet."}
            </TextComponent>
          </Box>
        ) : (
          <table className="w-full border-separate border-spacing-0">
            <tbody>
              {patients.map((patient) => (
                <PatientRow
                  key={patient.id}
                  patient={patient}
                  hasClinicalRead={hasClinicalRead}
                  hasBillingRead={hasBillingRead}
                />
              ))}
            </tbody>
          </table>
        )}
      </Box>

      {totalPages > 1 && (
        <Box className="border-t border-line px-5 py-3 flex items-center justify-between">
          <TextComponent className="text-[13px] text-muted">
            Page {currentPage} of {totalPages}
          </TextComponent>
          <Box className="flex items-center gap-2">
            <Button
              type="button"
              variant="ghost"
              size="sm"
              disabled={currentPage === 1}
              onClick={() => applyFilters({ ...filters, page: currentPage - 1 })}
            >
              <Icon name="chev" size={16} className="rotate-180" />
              Previous
            </Button>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              disabled={currentPage === totalPages}
              onClick={() => applyFilters({ ...filters, page: currentPage + 1 })}
            >
              Next
              <Icon name="chev" size={16} />
            </Button>
          </Box>
        </Box>
      )}
    </Box>
  );
}
