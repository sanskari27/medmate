import { useState, type ChangeEvent } from "react";
import {
  BLOOD_GROUPS,
  DOC_LABELS,
  EMPLOYEE_POSITIONS,
  EMPLOYMENT_TYPES,
  blankEmployee,
  isValidIfsc,
  type Employee,
  type EmployeeDoc,
  type EmploymentType,
} from "@/utils";
import { toYmd } from "@/utils/date";
import { Box, Button, Heading, Image, Input, Select, Stack, Text } from "@/components/atoms";
import { IconDoc, IconIdCard, IconUpload } from "@/components/atoms";
import { Field } from "@/components/molecules/Field";
import { Modal } from "@/components/molecules/Modal";
import {
  documentKind,
  employeeDraftIsValid,
  readFileAsDataUrl,
} from "@/screens/Employees/Employees.utils";
import type { EmployeeDraft } from "@/screens/Employees/Employees.types";

import type { EmployeeFormProps } from "./EmployeeForm.types";

export function EmployeeForm({ initial, onClose, onSave, now, onIdCard }: EmployeeFormProps) {
  const [form, setForm] = useState<EmployeeDraft>(function initialDraft() {
    return initial ? { ...initial } : { ...blankEmployee(), joinedOn: toYmd(now) };
  });
  const [docLabel, setDocLabel] = useState(DOC_LABELS[0]);
  const ifscInvalid = Boolean(form.ifsc && !isValidIfsc(form.ifsc));
  const canSave = employeeDraftIsValid(form, ifscInvalid);
  const documents = form.documents ?? [];

  function updateForm(patch: Partial<EmployeeDraft>) {
    setForm(function merge(current) {
      return { ...current, ...patch };
    });
  }

  function openPhotoPicker() {
    document.getElementById("employee-photo-input")?.click();
  }

  function handlePhotoChange(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;
    readFileAsDataUrl(file, function applyPhoto(dataUrl) {
      updateForm({ photo: dataUrl });
    });
  }

  function handleRemovePhoto() {
    updateForm({ photo: undefined });
  }

  function handleDocLabelChange(event: ChangeEvent<HTMLSelectElement>) {
    setDocLabel(event.target.value);
  }

  function openDocPicker() {
    document.getElementById("employee-doc-input")?.click();
  }

  function addDocument(documentFile: EmployeeDoc) {
    setForm(function append(current) {
      return { ...current, documents: [...(current.documents ?? []), documentFile] };
    });
  }

  function handleDocsChange(event: ChangeEvent<HTMLInputElement>) {
    const files = Array.from(event.target.files ?? []);
    for (const file of files) {
      const kind = documentKind(file);
      readFileAsDataUrl(file, function applyDocument(dataUrl) {
        addDocument({
          id: `DOC-${Date.now()}-${Math.round(Math.random() * 1e5)}`,
          label: docLabel,
          kind,
          fileName: file.name,
          dataUrl,
          at: Date.now(),
        });
      });
    }
    event.target.value = "";
  }

  function handleSave() {
    onSave(form);
  }

  return (
    <Modal
      title={initial ? `Edit ${initial.name}` : "Add Employee"}
      onClose={onClose}
      className="max-w-[640px]"
      footer={
        <>
          {onIdCard ? (
            <Button variant="ghost" onClick={onIdCard}>
              <IconIdCard size={14} /> ID card
            </Button>
          ) : null}
          <Button variant="ghost" onClick={onClose}>
            Cancel
          </Button>
          <Button variant="primary" disabled={!canSave} onClick={handleSave}>
            {initial ? "Save changes" : "Add employee"}
          </Button>
        </>
      }
    >
      <Box className="grid max-h-[60vh] gap-3.5 overflow-y-auto">
        {initial ? (
          <Text variant="caption" className="font-mono">
            {initial.id}
          </Text>
        ) : null}
        <SectionTitle title="Personal" />
        <Stack direction="row" align="center" gap={3}>
          <Input
            id="employee-photo-input"
            type="file"
            accept="image/*"
            className="hidden"
            onChange={handlePhotoChange}
          />
          <Button
            variant="ghost"
            title="Upload photo"
            className={
              form.photo
                ? "h-[86px] w-[72px] shrink-0 overflow-hidden rounded-[10px] border-dashed bg-black p-0"
                : "h-[86px] w-[72px] shrink-0 overflow-hidden rounded-[10px] border-dashed bg-wash-2 p-0"
            }
            onClick={openPhotoPicker}
          >
            {form.photo ? (
              <Image src={form.photo} alt="" fit="cover" className="h-full w-full" />
            ) : (
              <Text variant="caption" className="text-center text-muted">
                <IconUpload size={16} /> Photo
              </Text>
            )}
          </Button>
          <Stack gap={1}>
            <Stack direction="row" gap={2}>
              <Button variant="ghost" size="sm" onClick={openPhotoPicker}>
                <IconUpload size={13} /> {form.photo ? "Change photo" : "Upload photo"}
              </Button>
              {form.photo ? (
                <Button variant="ghost" size="sm" className="text-rose" onClick={handleRemovePhoto}>
                  Remove
                </Button>
              ) : null}
            </Stack>
            <Text variant="caption">Used on the digital ID card · passport-style works best</Text>
          </Stack>
        </Stack>
        <Box className="grid grid-cols-2 gap-3.5">
          <TextField
            label="Full name *"
            id="employee-name"
            field="name"
            value={form.name}
            onPatch={updateForm}
            placeholder="e.g. Anjali Menon"
          />
          <TextField
            label="Phone *"
            id="employee-phone"
            field="phone"
            value={form.phone}
            onPatch={updateForm}
            placeholder="+91 …"
          />
          <TextField
            label="Email"
            id="employee-email"
            field="email"
            value={form.email ?? ""}
            onPatch={updateForm}
            placeholder="name@pharmacy.in"
          />
          <TextField
            label="Date of birth"
            id="employee-dob"
            field="dob"
            value={form.dob ?? ""}
            onPatch={updateForm}
            type="date"
          />
          <Field label="Blood group" htmlFor="employee-blood">
            <Select
              id="employee-blood"
              value={form.bloodGroup ?? ""}
              onChange={function handleBlood(event) {
                updateForm({ bloodGroup: event.target.value });
              }}
              options={[{ value: "", label: "\u2014" }, ...BloodOptions()]}
            />
          </Field>
        </Box>
        <TextField
          label="Address"
          id="employee-address"
          field="address"
          value={form.address ?? ""}
          onPatch={updateForm}
          placeholder="Residential address"
        />

        <SectionTitle title="Employment" />
        <Box className="grid grid-cols-2 gap-3.5">
          <Field label="Position *" htmlFor="employee-position">
            <Select
              id="employee-position"
              value={form.position}
              onChange={function handlePosition(event) {
                updateForm({ position: event.target.value });
              }}
              options={[...EmploymentPositionOptions()]}
            />
          </Field>
          <TextField
            label="Department"
            id="employee-department"
            field="department"
            value={form.department ?? ""}
            onPatch={updateForm}
            placeholder="e.g. Dispensing"
          />
          <Field label="Employment type" htmlFor="employee-type">
            <Select
              id="employee-type"
              value={form.employment}
              onChange={function handleEmployment(event) {
                updateForm({ employment: event.target.value as EmploymentType });
              }}
              options={[...EmploymentTypeOptions()]}
            />
          </Field>
          <Field label="Status" htmlFor="employee-status">
            <Select
              id="employee-status"
              value={form.status}
              onChange={function handleStatus(event) {
                updateForm({ status: event.target.value as Employee["status"] });
              }}
              options={[
                { value: "active", label: "Active" },
                { value: "inactive", label: "Inactive" },
              ]}
            />
          </Field>
          <TextField
            label="Joining date"
            id="employee-joined"
            field="joinedOn"
            value={form.joinedOn}
            onPatch={updateForm}
            type="date"
          />
          <TextField
            label="Monthly salary ₹"
            id="employee-salary"
            field="salary"
            value={form.salary ? String(form.salary) : ""}
            onPatch={updateSalary}
            placeholder="0"
            inputMode="numeric"
          />
        </Box>

        <SectionTitle title="Statutory IDs" />
        <Box className="grid grid-cols-2 gap-3.5">
          <TextField
            label="PAN"
            id="employee-pan"
            field="pan"
            value={form.pan ?? ""}
            onPatch={updateForm}
            placeholder="ABCDE1234F"
            transform={toUpperCase}
          />
          <TextField
            label="Aadhaar"
            id="employee-aadhaar"
            field="aadhaar"
            value={form.aadhaar ?? ""}
            onPatch={updateForm}
            placeholder="XXXX XXXX XXXX"
          />
        </Box>

        <SectionTitle title={documents.length ? `Documents · ${documents.length}` : "Documents"} />
        <Input
          id="employee-doc-input"
          type="file"
          accept="image/*,application/pdf,.pdf"
          multiple
          className="hidden"
          onChange={handleDocsChange}
        />
        <Stack direction="row" align="end" wrap gap={2}>
          <Field
            label="Document type"
            htmlFor="employee-doc-label"
            className="min-w-[200px] flex-1"
          >
            <Select
              id="employee-doc-label"
              value={docLabel}
              onChange={handleDocLabelChange}
              options={[...DocLabelOptions()]}
            />
          </Field>
          <Button variant="ghost" onClick={openDocPicker}>
            <IconUpload size={14} /> Upload photo / PDF
          </Button>
        </Stack>
        <Text variant="caption">
          Attach ID proofs & certificates — JPG/PNG or PDF. You can select multiple files.
        </Text>
        {documents.length === 0 ? (
          <Stack
            align="center"
            className="rounded-md border border-dashed border-line-2 px-2.5 py-[18px] text-center"
          >
            <Box className="mb-3 grid h-11 w-11 place-items-center rounded-md bg-wash text-mid">
              <IconDoc size={26} />
            </Box>
            <Text variant="muted">No documents yet — upload Aadhaar, PAN, licence, etc.</Text>
          </Stack>
        ) : (
          <Box className="overflow-hidden rounded-md border border-line bg-paper">
            <DocumentRows documents={documents} />
          </Box>
        )}

        <SectionTitle title="Salary bank account" />
        <Box className="grid grid-cols-2 gap-3.5">
          <TextField
            label="Bank name"
            id="employee-bank"
            field="bankName"
            value={form.bankName ?? ""}
            onPatch={updateForm}
            placeholder="e.g. HDFC Bank"
          />
          <TextField
            label="Account holder name"
            id="employee-holder"
            field="accountName"
            value={form.accountName ?? ""}
            onPatch={updateForm}
            placeholder="As per bank"
          />
          <TextField
            label="Account number"
            id="employee-account"
            field="accountNumber"
            value={form.accountNumber ?? ""}
            onPatch={updateForm}
            placeholder="Account no."
          />
          <Field
            label="IFSC"
            htmlFor="employee-ifsc"
            error={ifscInvalid ? "Invalid IFSC" : undefined}
          >
            <Input
              id="employee-ifsc"
              data-field="ifsc"
              className={ifscInvalid ? "border-rose" : undefined}
              value={form.ifsc ?? ""}
              onChange={function handleIfsc(event) {
                updateForm({ ifsc: event.target.value.toUpperCase() });
              }}
              placeholder="HDFC0001234"
            />
          </Field>
          <TextField
            label="UPI ID"
            id="employee-upi"
            field="upi"
            value={form.upi ?? ""}
            onPatch={updateForm}
            placeholder="name@bank"
          />
        </Box>

        <SectionTitle title="Emergency contact" />
        <Box className="grid grid-cols-2 gap-3.5">
          <TextField
            label="Contact name"
            id="employee-emergency-name"
            field="emergencyName"
            value={form.emergencyName ?? ""}
            onPatch={updateForm}
            placeholder="Name"
          />
          <TextField
            label="Contact phone"
            id="employee-emergency-phone"
            field="emergencyPhone"
            value={form.emergencyPhone ?? ""}
            onPatch={updateForm}
            placeholder="+91 …"
          />
        </Box>
        <TextField
          label="Notes"
          id="employee-note"
          field="note"
          value={form.note ?? ""}
          onPatch={updateForm}
          placeholder="Anything else to record"
        />
      </Box>
    </Modal>
  );

  function updateSalary(patch: Partial<EmployeeDraft>) {
    const raw = patch.salary;
    updateForm({ salary: Number(raw) || 0 });
  }
}

function toUpperCase(value: string) {
  return value.toUpperCase();
}

function SectionTitle({ title }: { title: string }) {
  return (
    <Heading
      level={4}
      className="border-b border-line pb-1.5 text-[13px] font-extrabold uppercase tracking-[0.04em] text-muted"
    >
      {title}
    </Heading>
  );
}

function TextField({
  label,
  id,
  field,
  value,
  onPatch,
  placeholder,
  type = "text",
  inputMode,
  transform,
}: {
  label: string;
  id: string;
  field: keyof EmployeeDraft;
  value: string;
  onPatch: (patch: Partial<EmployeeDraft>) => void;
  placeholder?: string;
  type?: string;
  inputMode?: "numeric";
  transform?: (value: string) => string;
}) {
  function handleChange(event: ChangeEvent<HTMLInputElement>) {
    const next = transform ? transform(event.target.value) : event.target.value;
    onPatch({ [field]: next } as Partial<EmployeeDraft>);
  }
  const dataField = field === "name" || field === "phone" || field === "email" ? field : undefined;
  return (
    <Field label={label} htmlFor={id}>
      <Input
        id={id}
        data-field={dataField}
        type={type}
        inputMode={inputMode}
        value={value}
        onChange={handleChange}
        placeholder={placeholder}
      />
    </Field>
  );
}

function BloodOptions() {
  function renderBlood(group: string) {
    return { value: String(group), label: String(group) };
  }
  return BLOOD_GROUPS.map(renderBlood);
}

function EmploymentPositionOptions() {
  function renderPosition(position: string) {
    return { value: String(position), label: String(position) };
  }
  return EMPLOYEE_POSITIONS.map(renderPosition);
}

function EmploymentTypeOptions() {
  function renderType(employment: string) {
    return { value: String(employment), label: String(employment) };
  }
  return EMPLOYMENT_TYPES.map(renderType);
}

function DocLabelOptions() {
  function renderLabel(label: string) {
    return { value: String(label), label: String(label) };
  }
  return DOC_LABELS.map(renderLabel);
}

function DocumentRows({ documents }: { documents: EmployeeDoc[] }) {
  function renderDocument(documentFile: EmployeeDoc) {
    return <DocumentRow key={documentFile.id} documentFile={documentFile} />;
  }
  return documents.map(renderDocument);
}

function DocumentRow({ documentFile }: { documentFile: EmployeeDoc }) {
  return (
    <Stack
      direction="row"
      align="center"
      gap={3}
      className="border-b border-line px-[13px] py-[9px] last:border-0"
    >
      {documentFile.kind === "image" ? (
        <Box className="grid h-10 w-10 shrink-0 place-items-center overflow-hidden rounded-sm bg-wash text-mid">
          <Image src={documentFile.dataUrl} alt="" fit="cover" className="h-full w-full" />
        </Box>
      ) : (
        <Box className="grid h-10 w-10 shrink-0 place-items-center rounded-sm bg-rose-bg text-rose">
          <IconDoc size={18} />
        </Box>
      )}
      <Stack gap={0} className="min-w-0 flex-1">
        <Text as="span" className="text-[13px] font-bold">
          {documentFile.label}
        </Text>
        <Text variant="caption" className="truncate">
          {documentFile.fileName} · {documentFile.kind === "pdf" ? "PDF" : "Image"}
        </Text>
      </Stack>
      <Button asChild variant="ghost" size="sm">
        <a href={documentFile.dataUrl} target="_blank" rel="noreferrer">
          View
        </a>
      </Button>
      <Button asChild variant="ghost" size="sm" title="Download">
        <a href={documentFile.dataUrl} download={documentFile.fileName}>
          <Box className="inline-flex rotate-180">
            <IconUpload size={14} />
          </Box>
        </a>
      </Button>
    </Stack>
  );
}
