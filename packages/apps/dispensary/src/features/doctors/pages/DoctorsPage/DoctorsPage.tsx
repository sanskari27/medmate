import { useState, type ChangeEvent } from "react";
import { Box } from "@/components/ui/Box";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Stack } from "@/components/ui/Stack";
import { Text } from "@/components/ui/Text";
import { problemMessage, useAuthState } from "@/features/authentication";
import { DoctorForm } from "../../components/DoctorForm";
import {
  useCreateDoctorMutation,
  useListDoctorsQuery,
  useUpdateDoctorMutation,
} from "../../doctors.api";
import {
  doctorAccess,
  draftIsValid,
  filterDoctors,
  payload,
  relationshipLabel,
  toFormData,
  type Doctor,
  type DoctorDraft,
  type PendingDocument,
  type StoredDocumentDraft,
} from "../../model";

export function DoctorsPage() {
  const { session } = useAuthState();
  const access = doctorAccess(session?.account.pharmacyRole, session?.account.permissions);
  const list = useListDoctorsQuery();
  const [createDoctor, created] = useCreateDoctorMutation();
  const [updateDoctor, updated] = useUpdateDoctorMutation();
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState("all");
  const [editing, setEditing] = useState<Doctor | "new" | null>(null);
  const [error, setError] = useState<string | null>(null);
  const doctors = list.data?.doctors ?? [];
  const rows = filterDoctors(doctors, { query, status });
  const empty = doctors.length === 0 ? "No doctors yet." : "No doctors match your search.";

  async function save(
    draft: DoctorDraft,
    stored: StoredDocumentDraft[],
    photo: File | null,
    removePhoto: boolean,
    pending: PendingDocument[],
  ) {
    if (!draftIsValid(draft)) return;
    setError(null);
    const current = editing !== "new" && editing ? editing : null;
    const body =
      photo || removePhoto || pending.length
        ? toFormData(draft, stored, photo, removePhoto, pending)
        : payload(draft, stored, removePhoto);
    const result = current
      ? await updateDoctor({ id: current.id, body })
      : await createDoctor(body);
    if ("error" in result) {
      setError(problemMessage(result.error, "Could not save this doctor"));
      return;
    }
    setEditing(null);
  }

  if (list.isLoading) {
    return <Text className="text-[13.5px] text-muted">Loading doctors</Text>;
  }

  return (
    <Box className="mx-auto max-w-[1680px]">
      {list.isError ? (
        <Text className="mb-3 text-[12.5px] font-bold text-rose">
          {problemMessage(list.error, "Could not load doctors")}
        </Text>
      ) : null}
      <Stack direction="row" align="center" wrap className="mb-4 gap-2">
        <select
          aria-label="Status"
          className="w-[130px] rounded-sm border border-line-2 bg-paper px-3 py-[10.5px] text-[13px]"
          value={status}
          onChange={(event: ChangeEvent<HTMLSelectElement>) => setStatus(event.target.value)}
        >
          <option value="all">All</option>
          <option value="active">Active</option>
          <option value="inactive">Inactive</option>
        </select>
        <Stack
          direction="row"
          align="center"
          className="min-w-[240px] max-w-[360px] flex-1 gap-2 rounded-sm border border-line-2 bg-paper px-3 py-[10.5px]"
        >
          <Input
            variant="plain"
            aria-label="Search doctors"
            placeholder="Search name, code, mobile…"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            className="!py-0"
          />
        </Stack>
        <Box className="flex-1" />
        {access.create ? (
          <Button
            type="button"
            onClick={() => {
              setError(null);
              setEditing("new");
            }}
          >
            Add doctor
          </Button>
        ) : null}
      </Stack>
      <Box className="overflow-hidden rounded-md border border-line bg-paper shadow-sm">
        <Box className="overflow-x-auto">
          <table className="w-full border-separate border-spacing-0 text-[13px]">
            <thead>
              <tr>
                {["Doctor", "Code", "Specialization", "Mobile", "Relationship", "Status"].map(
                  (heading) => (
                    <th
                      key={heading}
                      className="bg-wash-2 px-3.5 py-[11px] text-left text-[10.5px] font-bold tracking-[0.07em] text-muted uppercase"
                    >
                      {heading}
                    </th>
                  ),
                )}
              </tr>
            </thead>
            <tbody>
              {rows.map((doctor) => (
                <tr key={doctor.id}>
                  <td className="px-3.5 py-[11px] font-bold">
                    <Stack direction="row" align="center" className="gap-2">
                      {doctor.photo ? (
                        <img
                          src={doctor.photo.url}
                          alt=""
                          className="h-8 w-8 rounded-full object-cover"
                        />
                      ) : null}
                      {access.update ? (
                        <Button
                          type="button"
                          variant="link"
                          className="h-auto px-0"
                          onClick={() => {
                            setError(null);
                            setEditing(doctor);
                          }}
                        >
                          {doctor.displayName}
                        </Button>
                      ) : (
                        doctor.displayName
                      )}
                    </Stack>
                  </td>
                  <td className="px-3.5 py-[11px] font-mono">{doctor.code}</td>
                  <td className="px-3.5 py-[11px]">{doctor.specialization}</td>
                  <td className="px-3.5 py-[11px]">{doctor.primaryMobile}</td>
                  <td className="px-3.5 py-[11px]">
                    {relationshipLabel(doctor.relationshipStatus)}
                  </td>
                  <td className="px-3.5 py-[11px]">
                    {doctor.status === "active" ? "Active" : "Inactive"}
                  </td>
                </tr>
              ))}
              {rows.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-5 py-9 text-center text-muted">
                    {empty}
                  </td>
                </tr>
              ) : null}
            </tbody>
          </table>
        </Box>
      </Box>
      {editing && (editing === "new" ? access.create : access.update) ? (
        <DoctorForm
          doctor={editing === "new" ? null : editing}
          saving={created.isLoading || updated.isLoading}
          error={error}
          onClose={() => setEditing(null)}
          onSave={(draft, stored, photo, removePhoto, pending) =>
            void save(draft, stored, photo, removePhoto, pending)
          }
        />
      ) : null}
    </Box>
  );
}
