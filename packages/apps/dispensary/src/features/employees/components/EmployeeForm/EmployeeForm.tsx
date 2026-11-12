import { useState, type ChangeEvent } from "react";
import { Box } from "@/components/ui/Box";
import { Button } from "@/components/ui/Button";
import { Field } from "@/components/ui/Field";
import { Heading } from "@/components/ui/Heading";
import { Input } from "@/components/ui/Input";
import { Stack } from "@/components/ui/Stack";
import { Text } from "@/components/ui/Text";
import {
  BLOOD_GROUPS,
  DOCUMENT_LABELS,
  EMPLOYMENT_TYPES,
  POSITIONS,
  blankDraft,
  draftFromEmployee,
  draftIsValid,
  isValidIfsc,
  type Employee,
  type EmployeeAccess,
  type EmployeeDraft,
  type PendingDocument,
} from "../../model";

const selectClass =
  "w-full rounded-sm border border-line-2 bg-paper px-3 py-[9px] text-[13.5px] text-ink outline-none focus:border-mid focus:shadow-focus disabled:bg-[#e9efeb] disabled:text-faint";

export function EmployeeForm({
  employee,
  access,
  saving,
  error,
  onClose,
  onSave,
  onIdCard,
}: {
  employee: Employee | null;
  access: EmployeeAccess;
  saving: boolean;
  error: string | null;
  onClose: () => void;
  onSave: (
    draft: EmployeeDraft,
    photo: File | null,
    removePhoto: boolean,
    documents: PendingDocument[],
  ) => void;
  onIdCard?: () => void;
}) {
  const [form, setForm] = useState<EmployeeDraft>(
    employee ? draftFromEmployee(employee) : blankDraft(),
  );
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [photoPreview, setPhotoPreview] = useState<string | null>(employee?.photo?.url ?? null);
  const [photoRemoved, setPhotoRemoved] = useState(false);
  const [docLabel, setDocLabel] = useState<string>(DOCUMENT_LABELS[0]);
  const [pending, setPending] = useState<PendingDocument[]>([]);
  const locked = Boolean(employee) && !access.update;
  const ifscInvalid = Boolean(form.ifsc.trim() && !isValidIfsc(form.ifsc));
  const canSave = draftIsValid(form) && !ifscInvalid;
  const showSave = employee
    ? access.update ||
      (access.inactivate && form.status === "inactive" && employee.status !== "inactive")
    : access.create;
  const title = employee ? `Edit ${employee.name}` : "Add Employee";
  const existing = employee?.documents ?? [];

  function patch(next: Partial<EmployeeDraft>) {
    setForm((current) => ({ ...current, ...next }));
  }

  function choosePhoto(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;
    setPhotoFile(file);
    setPhotoRemoved(false);
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === "string") setPhotoPreview(reader.result);
    };
    reader.readAsDataURL(file);
  }

  function chooseDocs(event: ChangeEvent<HTMLInputElement>) {
    const files = Array.from(event.target.files ?? []);
    event.target.value = "";
    setPending((current) => [...current, ...files.map((file) => ({ label: docLabel, file }))]);
  }

  return (
    <Box
      className="fixed inset-0 z-[100] flex items-center justify-center bg-[rgba(13,32,21,0.5)] p-6 backdrop-blur-[3px]"
      onClick={onClose}
    >
      <Box
        role="dialog"
        aria-label={title}
        className="flex max-h-[90vh] w-full max-w-[640px] flex-col overflow-hidden rounded-lg bg-paper shadow-pop"
        onClick={(event) => event.stopPropagation()}
      >
        <Box className="flex items-center justify-between border-b border-line px-5 py-4">
          <Heading level={3}>{title}</Heading>
          <Button type="button" variant="ghost" aria-label="Close" onClick={onClose}>
            ×
          </Button>
        </Box>
        <Box className="grid max-h-[60vh] gap-3.5 overflow-y-auto p-5">
          {employee ? (
            <Text variant="caption" className="font-mono">
              {employee.id}
            </Text>
          ) : null}
          {error ? <Text className="text-[12.5px] font-bold text-rose">{error}</Text> : null}
          <Section title="Personal" />
          <Stack direction="row" align="center" className="gap-3">
            <input
              id="employee-photo-input"
              type="file"
              accept="image/jpeg,image/png"
              className="hidden"
              disabled={locked}
              onChange={choosePhoto}
            />
            <Button
              type="button"
              variant="ghost"
              className="h-[86px] w-[72px] shrink-0 overflow-hidden rounded-[10px] border-dashed p-0"
              disabled={locked}
              onClick={() => document.getElementById("employee-photo-input")?.click()}
            >
              {photoPreview && !photoRemoved ? (
                <img src={photoPreview} alt="" className="h-full w-full object-cover" />
              ) : (
                <Text variant="caption">Photo</Text>
              )}
            </Button>
            <Stack className="gap-1">
              <Stack direction="row" className="gap-2">
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  disabled={locked}
                  onClick={() => document.getElementById("employee-photo-input")?.click()}
                >
                  {photoPreview && !photoRemoved ? "Change photo" : "Upload photo"}
                </Button>
                {photoPreview && !photoRemoved ? (
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="text-rose"
                    disabled={locked}
                    onClick={() => {
                      setPhotoFile(null);
                      setPhotoPreview(null);
                      setPhotoRemoved(true);
                    }}
                  >
                    Remove
                  </Button>
                ) : null}
              </Stack>
              <Text variant="caption">Used on the digital ID card · passport-style works best</Text>
            </Stack>
          </Stack>
          <Box className="grid grid-cols-2 gap-3.5">
            <TextInput
              label="Full name *"
              id="employee-name"
              value={form.name}
              disabled={locked}
              placeholder="e.g. Anjali Menon"
              onChange={(value) => patch({ name: value })}
            />
            <TextInput
              label="Phone *"
              id="employee-phone"
              value={form.phone}
              disabled={locked}
              placeholder="+91 …"
              onChange={(value) => patch({ phone: value })}
            />
            <TextInput
              label="Email"
              id="employee-email"
              value={form.email}
              disabled={locked}
              placeholder="name@pharmacy.in"
              onChange={(value) => patch({ email: value })}
            />
            <TextInput
              label="Date of birth"
              id="employee-dob"
              type="date"
              value={form.dob}
              disabled={locked}
              onChange={(value) => patch({ dob: value })}
            />
            <Field label="Blood group" htmlFor="employee-blood">
              <select
                id="employee-blood"
                className={selectClass}
                value={form.bloodGroup}
                disabled={locked}
                onChange={(event) => patch({ bloodGroup: event.target.value })}
              >
                <option value="">—</option>
                {BLOOD_GROUPS.map((group) => (
                  <option key={group} value={group}>
                    {group}
                  </option>
                ))}
              </select>
            </Field>
          </Box>
          <TextInput
            label="Address"
            id="employee-address"
            value={form.address}
            disabled={locked}
            placeholder="Residential address"
            onChange={(value) => patch({ address: value })}
          />

          <Section title="Employment" />
          <Box className="grid grid-cols-2 gap-3.5">
            <Field label="Position *" htmlFor="employee-position">
              <select
                id="employee-position"
                className={selectClass}
                value={form.position}
                disabled={locked}
                onChange={(event) => patch({ position: event.target.value })}
              >
                {POSITIONS.map((position) => (
                  <option key={position} value={position}>
                    {position}
                  </option>
                ))}
              </select>
            </Field>
            <TextInput
              label="Department"
              id="employee-department"
              value={form.department}
              disabled={locked}
              placeholder="e.g. Dispensing"
              onChange={(value) => patch({ department: value })}
            />
            <Field label="Employment type" htmlFor="employee-type">
              <select
                id="employee-type"
                className={selectClass}
                value={form.employment}
                disabled={locked}
                onChange={(event) =>
                  patch({ employment: event.target.value as EmployeeDraft["employment"] })
                }
              >
                {EMPLOYMENT_TYPES.map((employment) => (
                  <option key={employment} value={employment}>
                    {employment}
                  </option>
                ))}
              </select>
            </Field>
            <Field label="Status" htmlFor="employee-status">
              <select
                id="employee-status"
                className={selectClass}
                value={form.status}
                disabled={locked && !access.inactivate}
                onChange={(event) =>
                  patch({ status: event.target.value as EmployeeDraft["status"] })
                }
              >
                <option value="active">Active</option>
                <option value="inactive" disabled={!access.inactivate}>
                  Inactive
                </option>
              </select>
            </Field>
            <TextInput
              label="Joining date"
              id="employee-joined"
              type="date"
              value={form.joinedOn}
              disabled={locked}
              onChange={(value) => patch({ joinedOn: value })}
            />
            <TextInput
              label="Monthly salary ₹"
              id="employee-salary"
              value={form.salary}
              disabled={locked}
              inputMode="numeric"
              placeholder="0"
              onChange={(value) => patch({ salary: value.replace(/[^\d]/g, "") })}
            />
          </Box>

          <Section title="Statutory IDs" />
          <Box className="grid grid-cols-2 gap-3.5">
            <TextInput
              label="PAN"
              id="employee-pan"
              value={form.pan}
              disabled={locked}
              placeholder="ABCDE1234F"
              onChange={(value) => patch({ pan: value.toUpperCase() })}
            />
            <TextInput
              label="Aadhaar"
              id="employee-aadhaar"
              value={form.aadhaar}
              disabled={locked}
              placeholder="XXXX XXXX XXXX"
              onChange={(value) => patch({ aadhaar: value })}
            />
          </Box>

          <Section
            title={
              pending.length + existing.length
                ? `Documents · ${pending.length + existing.length}`
                : "Documents"
            }
          />
          <input
            id="employee-doc-input"
            type="file"
            accept="image/jpeg,image/png,application/pdf"
            multiple
            className="hidden"
            disabled={locked}
            onChange={chooseDocs}
          />
          <Stack direction="row" align="end" className="flex-wrap gap-2">
            <Field
              label="Document type"
              htmlFor="employee-doc-label"
              className="min-w-[200px] flex-1"
            >
              <select
                id="employee-doc-label"
                className={selectClass}
                value={docLabel}
                disabled={locked}
                onChange={(event) => setDocLabel(event.target.value)}
              >
                {DOCUMENT_LABELS.map((label) => (
                  <option key={label} value={label}>
                    {label}
                  </option>
                ))}
              </select>
            </Field>
            <Button
              type="button"
              variant="ghost"
              disabled={locked}
              onClick={() => document.getElementById("employee-doc-input")?.click()}
            >
              Upload photo / PDF
            </Button>
          </Stack>
          <Text variant="caption">
            Attach ID proofs & certificates — JPG/PNG or PDF. You can select multiple files.
          </Text>
          {existing.length + pending.length === 0 ? (
            <Text
              variant="muted"
              className="rounded-md border border-dashed border-line-2 px-2.5 py-[18px] text-center"
            >
              No documents yet — upload Aadhaar, PAN, licence, etc.
            </Text>
          ) : (
            <Stack className="overflow-hidden rounded-md border border-line">
              {existing.map((documentFile) => (
                <Stack
                  key={documentFile.id}
                  direction="row"
                  align="center"
                  className="justify-between border-b border-line px-3 py-2 last:border-0"
                >
                  <Text className="text-[13px] font-bold">{documentFile.label}</Text>
                  <a
                    href={documentFile.url}
                    target="_blank"
                    rel="noreferrer"
                    className="text-[13px] font-bold text-mid"
                  >
                    View
                  </a>
                </Stack>
              ))}
              {pending.map((documentFile) => (
                <Text
                  key={`${documentFile.label}-${documentFile.file.name}`}
                  className="border-b border-line px-3 py-2 text-[13px] last:border-0"
                >
                  {documentFile.label} · {documentFile.file.name}
                </Text>
              ))}
            </Stack>
          )}

          <Section title="Salary bank account" />
          <Box className="grid grid-cols-2 gap-3.5">
            <TextInput
              label="Bank name"
              id="employee-bank"
              value={form.bankName}
              disabled={locked}
              placeholder="e.g. HDFC Bank"
              onChange={(value) => patch({ bankName: value })}
            />
            <TextInput
              label="Account holder name"
              id="employee-holder"
              value={form.accountName}
              disabled={locked}
              placeholder="As per bank"
              onChange={(value) => patch({ accountName: value })}
            />
            <TextInput
              label="Account number"
              id="employee-account"
              value={form.accountNumber}
              disabled={locked}
              placeholder="Account no."
              onChange={(value) => patch({ accountNumber: value })}
            />
            <Field
              label="IFSC"
              htmlFor="employee-ifsc"
              error={ifscInvalid ? "Invalid IFSC" : undefined}
            >
              <Input
                id="employee-ifsc"
                value={form.ifsc}
                disabled={locked}
                placeholder="HDFC0001234"
                onChange={(event) => patch({ ifsc: event.target.value.toUpperCase() })}
              />
            </Field>
            <TextInput
              label="UPI ID"
              id="employee-upi"
              value={form.upi}
              disabled={locked}
              placeholder="name@bank"
              onChange={(value) => patch({ upi: value })}
            />
          </Box>

          <Section title="Emergency contact" />
          <Box className="grid grid-cols-2 gap-3.5">
            <TextInput
              label="Contact name"
              id="employee-emergency-name"
              value={form.emergencyName}
              disabled={locked}
              placeholder="Name"
              onChange={(value) => patch({ emergencyName: value })}
            />
            <TextInput
              label="Contact phone"
              id="employee-emergency-phone"
              value={form.emergencyPhone}
              disabled={locked}
              placeholder="+91 …"
              onChange={(value) => patch({ emergencyPhone: value })}
            />
          </Box>
          <Section title="Notes" />
          <TextInput
            label="Notes"
            id="employee-note"
            value={form.note}
            disabled={locked}
            placeholder="Anything else to record"
            onChange={(value) => patch({ note: value })}
          />
        </Box>
        <Stack direction="row" justify="end" className="gap-2 border-t border-line px-5 py-4">
          {onIdCard ? (
            <Button type="button" variant="ghost" onClick={onIdCard}>
              ID card
            </Button>
          ) : null}
          <Button type="button" variant="ghost" onClick={onClose}>
            Cancel
          </Button>
          {showSave ? (
            <Button
              type="button"
              disabled={!canSave || saving}
              onClick={() => onSave(form, photoFile, photoRemoved && !photoFile, pending)}
            >
              {employee ? "Save changes" : "Add employee"}
            </Button>
          ) : null}
        </Stack>
      </Box>
    </Box>
  );
}

function Section({ title }: { title: string }) {
  return (
    <Heading
      level={4}
      className="border-b border-line pb-1.5 text-[13px] font-extrabold tracking-[0.04em] text-muted uppercase"
    >
      {title}
    </Heading>
  );
}

function TextInput({
  label,
  id,
  value,
  disabled,
  placeholder,
  type = "text",
  inputMode,
  onChange,
}: {
  label: string;
  id: string;
  value: string;
  disabled?: boolean;
  placeholder?: string;
  type?: string;
  inputMode?: "numeric";
  onChange: (value: string) => void;
}) {
  return (
    <Field label={label} htmlFor={id}>
      <Input
        id={id}
        type={type}
        inputMode={inputMode}
        value={value}
        disabled={disabled}
        placeholder={placeholder}
        onChange={(event) => onChange(event.target.value)}
      />
    </Field>
  );
}
