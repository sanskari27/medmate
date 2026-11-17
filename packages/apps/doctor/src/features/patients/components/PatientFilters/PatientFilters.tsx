import { Box, Input, Text as TextComponent } from "@/components/ui";
import { Icon } from "@/components/Icon";
import type { ChangeEvent } from "react";
import type { PatientListFilters, PatientSort, PatientStatus } from "@/types";

type PatientFiltersProps = {
  filters: PatientListFilters;
  onChange: (filters: PatientListFilters) => void;
  total: number;
};

export function PatientFilters({ filters, onChange, total }: PatientFiltersProps) {
  const statusOptions: { value: PatientStatus | "all"; label: string }[] = [
    { value: "all", label: "All status" },
    { value: "waiting", label: "Waiting" },
    { value: "with-doctor", label: "With doctor" },
    { value: "seen", label: "Seen" },
    { value: "inactive", label: "Inactive" },
  ];

  const dueOptions = [
    { value: "all", label: "All" },
    { value: "true", label: "Has due" },
    { value: "false", label: "No due" },
  ];

  const sortOptions: { value: PatientSort; label: string }[] = [
    { value: "name", label: "Name" },
    { value: "last-seen", label: "Last seen" },
  ];

  return (
    <Box className="mb-4 flex flex-wrap items-center gap-2">
      <Box className="min-w-[240px] max-w-[360px] flex-1">
        <label htmlFor="patient-search" className="sr-only">
          Search patients
        </label>
        <Box className="relative">
          <Icon
            name="search"
            size={18}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-muted"
          />
          <Input
            id="patient-search"
            placeholder="Search name or phone…"
            value={filters.q ?? ""}
            onChange={(e: ChangeEvent<HTMLInputElement>) =>
              onChange({ ...filters, q: e.target.value || undefined, page: 1 })
            }
            className="pl-10"
          />
        </Box>
      </Box>

      <select
        aria-label="Status"
        value={filters.status ?? "all"}
        onChange={(e: ChangeEvent<HTMLSelectElement>) =>
          onChange({
            ...filters,
            status: e.target.value === "all" ? undefined : (e.target.value as PatientStatus),
            page: 1,
          })
        }
        className="w-[150px] rounded-control border border-line-2 bg-surface px-3 py-2 text-[13px] text-ink outline-none focus:border-green"
      >
        {statusOptions.map((opt) => (
          <option key={opt.value} value={opt.value}>
            {opt.label}
          </option>
        ))}
      </select>

      <select
        aria-label="Due"
        value={filters.due === true ? "true" : filters.due === false ? "false" : "all"}
        onChange={(e: ChangeEvent<HTMLSelectElement>) =>
          onChange({
            ...filters,
            due: e.target.value === "all" ? undefined : e.target.value === "true",
            page: 1,
          })
        }
        className="w-[120px] rounded-control border border-line-2 bg-surface px-3 py-2 text-[13px] text-ink outline-none focus:border-green"
      >
        {dueOptions.map((opt) => (
          <option key={opt.value} value={opt.value}>
            {opt.label}
          </option>
        ))}
      </select>

      <select
        aria-label="Sort"
        value={filters.sort ?? "name"}
        onChange={(e: ChangeEvent<HTMLSelectElement>) =>
          onChange({ ...filters, sort: e.target.value as PatientSort })
        }
        className="w-[120px] rounded-control border border-line-2 bg-surface px-3 py-2 text-[13px] text-ink outline-none focus:border-green"
      >
        {sortOptions.map((opt) => (
          <option key={opt.value} value={opt.value}>
            {opt.label}
          </option>
        ))}
      </select>

      <Box className="flex-1" />

      <TextComponent className="text-[13px] text-muted">
        {total} patient{total !== 1 ? "s" : ""}
      </TextComponent>
    </Box>
  );
}
