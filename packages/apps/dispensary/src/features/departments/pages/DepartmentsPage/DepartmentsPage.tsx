import { useState, type ChangeEvent } from "react";
import { Box } from "@/components/ui/Box";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Stack } from "@/components/ui/Stack";
import { Text } from "@/components/ui/Text";
import { problemMessage, useAuthState } from "@/features/authentication";
import { DepartmentForm } from "../../components/DepartmentForm";
import {
  useCreateDepartmentMutation,
  useListDepartmentsQuery,
  useUpdateDepartmentMutation,
} from "../../departments.api";
import {
  departmentAccess,
  draftIsValid,
  filterDepartments,
  payload,
  type Department,
  type DepartmentDraft,
} from "../../model";

export function DepartmentsPage() {
  const { session } = useAuthState();
  const access = departmentAccess(session?.account.pharmacyRole, session?.account.permissions);
  const list = useListDepartmentsQuery();
  const [createDepartment, created] = useCreateDepartmentMutation();
  const [updateDepartment, updated] = useUpdateDepartmentMutation();
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState("all");
  const [editing, setEditing] = useState<Department | "new" | null>(null);
  const [error, setError] = useState<string | null>(null);
  const departments = list.data?.departments ?? [];
  const rows = filterDepartments(departments, { query, status });
  const empty =
    departments.length === 0 ? "No departments yet." : "No departments match your search.";

  async function save(draft: DepartmentDraft) {
    if (!draftIsValid(draft)) return;
    setError(null);
    const current = editing !== "new" && editing ? editing : null;
    const body = payload(draft);
    const result = current
      ? await updateDepartment({ id: current.id, body })
      : await createDepartment(body);
    if ("error" in result) {
      setError(problemMessage(result.error, "Could not save this department"));
      return;
    }
    setEditing(null);
  }

  if (list.isLoading) {
    return <Text className="text-[13.5px] text-muted">Loading departments</Text>;
  }

  return (
    <Box className="mx-auto max-w-[1680px]">
      {list.isError ? (
        <Text className="mb-3 text-[12.5px] font-bold text-rose">
          {problemMessage(list.error, "Could not load departments")}
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
            aria-label="Search departments"
            placeholder="Search name or code…"
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
            Add department
          </Button>
        ) : null}
      </Stack>
      <Box className="overflow-hidden rounded-md border border-line bg-paper shadow-sm">
        <Box className="overflow-x-auto">
          <table className="w-full border-separate border-spacing-0 text-[13px]">
            <thead>
              <tr>
                {["Name", "Code", "Parent", "Order", "Status"].map((heading) => (
                  <th
                    key={heading}
                    className="bg-wash-2 px-3.5 py-[11px] text-left text-[10.5px] font-bold tracking-[0.07em] text-muted uppercase"
                  >
                    {heading}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {rows.map((department) => (
                <tr key={department.id}>
                  <td className="px-3.5 py-[11px] font-bold">
                    {access.update ? (
                      <Button
                        type="button"
                        variant="link"
                        className="h-auto px-0"
                        onClick={() => {
                          setError(null);
                          setEditing(department);
                        }}
                      >
                        {department.name}
                      </Button>
                    ) : (
                      department.name
                    )}
                  </td>
                  <td className="px-3.5 py-[11px] font-mono">{department.code}</td>
                  <td className="px-3.5 py-[11px]">{department.parent?.name ?? "—"}</td>
                  <td className="px-3.5 py-[11px]">{department.displayOrder}</td>
                  <td className="px-3.5 py-[11px]">
                    {department.isActive ? "Active" : "Inactive"}
                  </td>
                </tr>
              ))}
              {rows.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-5 py-9 text-center text-muted">
                    {empty}
                  </td>
                </tr>
              ) : null}
            </tbody>
          </table>
        </Box>
      </Box>
      {editing && (editing === "new" ? access.create : access.update) ? (
        <DepartmentForm
          department={editing === "new" ? null : editing}
          departments={departments}
          saving={created.isLoading || updated.isLoading}
          error={error}
          onClose={() => setEditing(null)}
          onSave={(draft) => void save(draft)}
        />
      ) : null}
    </Box>
  );
}
