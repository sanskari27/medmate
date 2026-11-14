import { useState, type FormEvent } from "react";
import { Box } from "@/components/ui/Box";
import { Button } from "@/components/ui/Button";
import { Field } from "@/components/ui/Field";
import { Heading } from "@/components/ui/Heading";
import { Input } from "@/components/ui/Input";
import { Stack } from "@/components/ui/Stack";
import { Text } from "@/components/ui/Text";
import {
  blankDraft,
  departmentLabel,
  draftFromDepartment,
  draftIsValid,
  parentChoices,
  type Department,
  type DepartmentDraft,
} from "../../model";

const selectClass =
  "w-full rounded-sm border border-line-2 bg-paper px-3 py-[9px] text-[13.5px] text-ink outline-none focus:border-mid focus:shadow-focus";

const areaClass =
  "min-h-16 w-full resize-y rounded-sm border border-line-2 bg-paper px-3 py-[9px] text-[13.5px] text-ink outline-none focus:border-mid focus:shadow-focus";

export function DepartmentForm({
  department,
  departments,
  saving,
  error,
  onClose,
  onSave,
}: {
  department: Department | null;
  departments: Department[];
  saving: boolean;
  error: string | null;
  onClose: () => void;
  onSave: (draft: DepartmentDraft) => void;
}) {
  const [form, setForm] = useState<DepartmentDraft>(
    department ? draftFromDepartment(department) : blankDraft(),
  );
  const title = department ? "Edit department" : "Add department";
  const choices = parentChoices(departments, department?.id ?? null);
  const canSave = draftIsValid(form);

  function patch(next: Partial<DepartmentDraft>) {
    setForm((current) => ({ ...current, ...next }));
  }

  function save(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!canSave || saving) return;
    onSave(form);
  }

  return (
    <Box
      className="fixed inset-0 z-[100] flex items-center justify-center bg-[rgba(13,32,21,0.5)] p-4 backdrop-blur-[3px] sm:p-6"
      onClick={onClose}
    >
      <Box
        role="dialog"
        aria-modal="true"
        aria-label={title}
        className="flex max-h-[90vh] w-full max-w-[560px] flex-col overflow-hidden rounded-lg bg-paper shadow-pop"
        onClick={(event) => event.stopPropagation()}
      >
        <form className="flex min-h-0 flex-1 flex-col" onSubmit={save}>
          <Stack
            direction="row"
            align="center"
            justify="between"
            className="shrink-0 gap-3 border-b border-line px-5 py-4"
          >
            <Heading level={3} className="truncate">
              {title}
            </Heading>
            <Button type="button" variant="ghost" size="sm" aria-label="Close" onClick={onClose}>
              ×
            </Button>
          </Stack>
          <Box className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-5 py-5">
            <Stack className="gap-4">
              {error ? (
                <Text role="alert" className="text-[12.5px] font-bold text-rose">
                  {error}
                </Text>
              ) : null}
              <Field label="Name *" htmlFor="department-name">
                <Input
                  id="department-name"
                  value={form.name}
                  autoFocus
                  autoComplete="off"
                  placeholder="Cardiology"
                  onChange={(event) => patch({ name: event.target.value })}
                />
              </Field>
              <Field label="Code *" htmlFor="department-code">
                <Input
                  id="department-code"
                  value={form.code}
                  autoComplete="off"
                  spellCheck={false}
                  placeholder="CARD"
                  className="font-mono"
                  onChange={(event) => patch({ code: event.target.value })}
                />
              </Field>
              <Field label="Description" htmlFor="department-description">
                <textarea
                  id="department-description"
                  className={areaClass}
                  value={form.description}
                  onChange={(event) => patch({ description: event.target.value })}
                />
              </Field>
              <Field label="Parent" htmlFor="department-parent">
                <select
                  id="department-parent"
                  className={selectClass}
                  value={form.parentDepartmentId}
                  onChange={(event) => patch({ parentDepartmentId: event.target.value })}
                >
                  <option value="">No parent</option>
                  {choices.map((choice) => (
                    <option key={choice.id} value={choice.id}>
                      {departmentLabel(choice)}
                    </option>
                  ))}
                </select>
              </Field>
              <Field label="Display order *" htmlFor="department-order">
                <Input
                  id="department-order"
                  value={form.displayOrder}
                  inputMode="numeric"
                  autoComplete="off"
                  onChange={(event) => patch({ displayOrder: event.target.value })}
                />
              </Field>
              <Field label="Active" htmlFor="department-active">
                <select
                  id="department-active"
                  className={selectClass}
                  value={form.isActive ? "active" : "inactive"}
                  onChange={(event) => patch({ isActive: event.target.value !== "inactive" })}
                >
                  <option value="active">Active</option>
                  <option value="inactive">Inactive</option>
                </select>
              </Field>
            </Stack>
          </Box>
          <Stack
            direction="row"
            justify="end"
            className="shrink-0 gap-2 border-t border-line px-5 py-4"
          >
            <Button type="button" variant="ghost" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" disabled={!canSave || saving}>
              Save department
            </Button>
          </Stack>
        </form>
      </Box>
    </Box>
  );
}
