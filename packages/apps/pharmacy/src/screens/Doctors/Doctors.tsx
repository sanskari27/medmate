import { useState, type ChangeEvent } from "react";
import { usePharma } from "@/hooks";
import { Box, Button, Input, Select, Stack, Text } from "@/components/atoms";
import { IconPlus, IconSearch } from "@/components/atoms";
import { EmptyState } from "@/components/molecules/EmptyState";
import { countDoctors, filterDoctors } from "./Doctors.utils";
import type { DoctorDraft, DoctorStatusFilter } from "./Doctors.types";
import type { DoctorProfile } from "@/utils/calculations/hospital";
import { DoctorCard } from "./components/DoctorCard";
import { DoctorModal } from "./components/DoctorModal";

export default function DoctorsScreen() {
  const { doctors, departments, addDoctor, updateDoctor } = usePharma();
  const [query, setQuery] = useState("");
  const [department, setDepartment] = useState("all");
  const [status, setStatus] = useState<DoctorStatusFilter>("all");
  const [editing, setEditing] = useState<DoctorProfile | "new" | null>(null);

  const rows = filterDoctors(doctors, { query, department, status });
  const counts = countDoctors(doctors);
  const departmentNames = departments.map(function departmentName(item) {
    return item.name;
  });

  function handleQueryChange(event: ChangeEvent<HTMLInputElement>) {
    setQuery(event.target.value);
  }

  function handleDepartmentChange(event: ChangeEvent<HTMLSelectElement>) {
    setDepartment(event.target.value);
  }

  function handleStatusChange(event: ChangeEvent<HTMLSelectElement>) {
    setStatus(event.target.value as DoctorStatusFilter);
  }

  function handleAddDoctor() {
    setEditing("new");
  }

  function handleEditDoctor(doctor: DoctorProfile) {
    setEditing(doctor);
  }

  function handleClose() {
    setEditing(null);
  }

  async function handleSave(draft: DoctorDraft) {
    if (editing === "new") {
      const error = await addDoctor(draft);
      if (!error) setEditing(null);
      return;
    }
    if (!editing) return;
    const error = await updateDoctor(editing.id, draft);
    if (!error) setEditing(null);
  }

  return (
    <Box className="mx-auto max-w-[1680px]">
      <Stack direction="row" wrap gap={2} className="mb-4">
        <SummaryChip label="Doctors" value={String(counts.total)} />
        <SummaryChip label="Available" value={String(counts.available)} />
        <SummaryChip label="On leave" value={String(counts.onLeave)} />
        <SummaryChip label="Departments" value={String(counts.departments)} />
      </Stack>

      <Stack direction="row" align="center" wrap gap={2} className="mb-4">
        <Select className="w-auto" value={department} onChange={handleDepartmentChange} aria-label="Department" options={[{ value: "all", label: "All departments" }, ...DepartmentFilterOptions({departments: departments})]} />
        <Select className="w-auto" value={status} onChange={handleStatusChange} aria-label="Status" options={[{ value: "all", label: "All status" }, { value: "active", label: "Available" }, { value: "on-leave", label: "On leave" }, { value: "visiting", label: "Visiting" }]} />
        <Stack direction="row" align="center" gap={2} className="min-w-[240px] max-w-[360px] flex-1 rounded-sm border border-line-2 bg-paper px-3 py-2">
          <Box className="text-green">
            <IconSearch size={17} />
          </Box>
          <Input
            variant="plain"
            aria-label="Search doctors"
            placeholder="Name, specialty, reg no…"
            value={query}
            onChange={handleQueryChange}
            className="placeholder:text-faint"
          />
        </Stack>
        <Box className="flex-1" />
        <Button variant="primary" onClick={handleAddDoctor}>
          <IconPlus size={16} /> Add Doctor
        </Button>
      </Stack>

      <Box className="mt-4 grid grid-cols-[repeat(auto-fill,minmax(min(100%,280px),1fr))] gap-4">
        <DoctorCards doctors={rows} onEdit={handleEditDoctor} />
        {rows.length === 0 ? <EmptyState title="No doctors match. Add one with “Add Doctor”." /> : null}
      </Box>

      {editing ? (
        <DoctorModal
          initial={editing === "new" ? null : editing}
          departments={departmentNames}
          onClose={handleClose}
          onSave={handleSave}
        />
      ) : null}
    </Box>
  );
}

function SummaryChip({ label, value }: { label: string; value: string }) {
  return (
    <Box className="rounded-[10px] border border-line bg-paper px-3.5 py-2 text-[12.5px] text-muted">
      {label}
      <Text className="mt-px block font-display text-[15px] font-extrabold text-dark">{value}</Text>
    </Box>
  );
}

function DepartmentFilterOptions({ departments }: { departments: { id: string; name: string }[] }) {
  return departments.map(renderDepartmentOption);
}

function renderDepartmentOption(department: { id: string; name: string }) {
  return { value: String(department.name), label: String(department.name) };
}

function DoctorCards({ doctors, onEdit }: { doctors: DoctorProfile[]; onEdit: (doctor: DoctorProfile) => void }) {
  return doctors.map(function renderDoctor(doctor) {
    return <DoctorCard key={doctor.id} doctor={doctor} onEdit={onEdit} />;
  });
}
