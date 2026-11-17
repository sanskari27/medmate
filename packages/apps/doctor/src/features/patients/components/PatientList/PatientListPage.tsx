import { useState } from "react";
import { Box, Button, Heading, Text as TextComponent } from "@/components/ui";
import { Icon } from "@/components/Icon";
import { PatientRow } from "../PatientRow";
import { PatientFilters } from "../PatientFilters";
import { usePatients } from "../../service/patients.service";
import { problemMessage } from "@/services/api";
import type { PatientListFilters } from "@/types";

export function PatientListPage() {
  const [filters, setFilters] = useState<PatientListFilters>({ page: 1, size: 25, sort: "name" });
  const { patients, total, page, size, hasClinicalRead, hasBillingRead, isLoading, isError, error, refetch } = usePatients(filters);

  const handleFilterChange = (newFilters: PatientListFilters) => {
    setFilters(newFilters);
  };

  const handlePageChange = (newPage: number) => {
    setFilters({ ...filters, page: newPage });
  };

  const totalPages = Math.ceil(total / size);

  if (isLoading) {
    return <TextComponent className="text-[13.5px] text-muted">Loading patients</TextComponent>;
  }

  if (isError) {
    return (
      <Box className="rounded-card border border-red-bg bg-red-bg p-4">
        <TextComponent className="text-red font-bold">Error loading patients</TextComponent>
        <TextComponent className="mt-1 text-[13px] text-red">{problemMessage(error, "Could not load the patient list")}</TextComponent>
        <Button type="button" variant="secondary" size="sm" className="mt-3" onClick={() => refetch()}>
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

      <PatientFilters filters={filters} onChange={handleFilterChange} total={total} />

      <Box className="overflow-x-auto">
        {patients.length === 0 ? (
          <Box className="px-6 py-12 text-center">
            <Icon name="users" size={48} className="mx-auto mb-3 text-muted" />
            <TextComponent className="text-[14px] font-bold text-ink mb-1">No patients</TextComponent>
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
            Page {page} of {totalPages}
          </TextComponent>
          <Box className="flex items-center gap-2">
            <Button
              type="button"
              variant="ghost"
              size="sm"
              disabled={page === 1}
              onClick={() => handlePageChange(page - 1)}
            >
              <Icon name="chev" size={16} className="rotate-180" />
              Previous
            </Button>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              disabled={page === totalPages}
              onClick={() => handlePageChange(page + 1)}
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