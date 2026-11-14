import {
  useRef,
  useState,
  type ChangeEvent,
  type ComponentProps,
  type FormEvent,
  type ReactNode,
} from "react";
import { Box } from "@/components/ui/Box";
import { Button } from "@/components/ui/Button";
import { Field } from "@/components/ui/Field";
import { Heading } from "@/components/ui/Heading";
import { Input } from "@/components/ui/Input";
import { Stack } from "@/components/ui/Stack";
import { Text } from "@/components/ui/Text";
import { cn } from "@/utils/className";
import {
  CONSULTATION_TYPES,
  DAYS,
  GENDERS,
  REGIONS,
  RELATIONSHIPS,
  VERIFICATION,
  WORKPLACE_TYPES,
  blankWindow,
  draftFromDoctor,
  draftIsValid,
  blankDraft,
  type Doctor,
  type DoctorDraft,
  type PendingDocument,
  type StoredDocumentDraft,
  type VerificationStatus,
  type WindowDraft,
} from "../../model";

const selectClass =
  "w-full rounded-sm border border-line-2 bg-paper px-3 py-[9px] text-[13.5px] text-ink outline-none focus:border-mid focus:shadow-focus";

const areaClass =
  "min-h-16 w-full resize-y rounded-sm border border-line-2 bg-paper px-3 py-[9px] text-[13.5px] text-ink outline-none focus:border-mid focus:shadow-focus";

const DAY_SHORT: Record<string, string> = {
  monday: "Mon",
  tuesday: "Tue",
  wednesday: "Wed",
  thursday: "Thu",
  friday: "Fri",
  saturday: "Sat",
  sunday: "Sun",
};

export function DoctorForm({
  doctor,
  saving,
  error,
  onClose,
  onSave,
}: {
  doctor: Doctor | null;
  saving: boolean;
  error: string | null;
  onClose: () => void;
  onSave: (
    draft: DoctorDraft,
    stored: StoredDocumentDraft[],
    photo: File | null,
    removePhoto: boolean,
    pending: PendingDocument[],
  ) => void;
}) {
  const photoInput = useRef<HTMLInputElement>(null);
  const documentInput = useRef<HTMLInputElement>(null);
  const documentTypeInput = useRef<HTMLInputElement>(null);
  const [form, setForm] = useState<DoctorDraft>(doctor ? draftFromDoctor(doctor) : blankDraft());
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [photoPreview, setPhotoPreview] = useState<string | null>(doctor?.photo?.url ?? null);
  const [photoRemoved, setPhotoRemoved] = useState(false);
  const [stored, setStored] = useState<StoredDocumentDraft[]>(
    (doctor?.documents ?? []).map((document) => ({
      id: document.id,
      documentType: document.documentType,
      fileName: document.fileName,
      verificationStatus: document.verificationStatus,
    })),
  );
  const [pendingType, setPendingType] = useState("");
  const [pendingStatus, setPendingStatus] = useState<VerificationStatus>("pending");
  const [pending, setPending] = useState<PendingDocument[]>([]);
  const [documentHint, setDocumentHint] = useState<string | null>(null);
  const canSave = draftIsValid(form);
  const title = doctor ? `Edit ${doctor.displayName}` : "Add doctor";
  const subtitle = doctor
    ? [doctor.specialization, doctor.workplaceName].filter(Boolean).join(" · ")
    : "Registration, workplace, and consultation hours";
  const showingPhoto = Boolean(photoPreview) && !photoRemoved;

  function patch(next: Partial<DoctorDraft>) {
    setForm((current) => ({ ...current, ...next }));
  }

  function patchWindow(index: number, next: Partial<WindowDraft>) {
    setForm((current) => ({
      ...current,
      windows: current.windows.map((window, item) =>
        item === index ? { ...window, ...next } : window,
      ),
    }));
  }

  function toggleDay(index: number, day: string) {
    const window = form.windows[index];
    if (!window) return;
    const days = window.days.includes(day)
      ? window.days.filter((item) => item !== day)
      : [...window.days, day];
    patchWindow(index, { days });
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

  function removePhoto() {
    setPhotoFile(null);
    setPhotoPreview(null);
    setPhotoRemoved(true);
  }

  function attachDocument() {
    if (!pendingType.trim()) {
      setDocumentHint("Enter a document type before attaching a file.");
      documentTypeInput.current?.focus();
      return;
    }
    setDocumentHint(null);
    documentInput.current?.click();
  }

  function chooseDocument(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;
    if (!pendingType.trim()) {
      setDocumentHint("Enter a document type before attaching a file.");
      documentTypeInput.current?.focus();
      return;
    }
    setPending((current) => [
      ...current,
      {
        documentType: pendingType.trim(),
        verificationStatus: pendingStatus,
        file,
      },
    ]);
    setPendingType("");
    setPendingStatus("pending");
    setDocumentHint(null);
  }

  function save(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!canSave || saving) return;
    onSave(form, stored, photoFile, photoRemoved && !photoFile, pending);
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
        className="flex max-h-[90vh] w-full max-w-[880px] flex-col overflow-hidden rounded-lg bg-paper shadow-pop"
        onClick={(event) => event.stopPropagation()}
      >
        <form className="flex min-h-0 flex-1 flex-col" onSubmit={save}>
          <Stack
            direction="row"
            align="center"
            justify="between"
            className="shrink-0 gap-3 border-b border-line px-5 py-4"
          >
            <Stack className="min-w-0 gap-0.5">
              <Heading level={3} className="truncate">
                {title}
              </Heading>
              {subtitle ? (
                <Text variant="caption" className="truncate">
                  {subtitle}
                </Text>
              ) : null}
            </Stack>
            <Button type="button" variant="ghost" size="sm" aria-label="Close" onClick={onClose}>
              ×
            </Button>
          </Stack>
          <Box className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-5 py-5">
            <Stack className="gap-5">
              {error ? (
                <Text role="alert" className="text-[12.5px] font-bold text-rose">
                  {error}
                </Text>
              ) : null}
              <Section title="Basic" />
              <Stack direction="row" align="center" className="gap-3">
                <input
                  ref={photoInput}
                  id="doctor-photo-input"
                  type="file"
                  accept="image/jpeg,image/png"
                  aria-label="Profile photo"
                  tabIndex={-1}
                  className="sr-only"
                  onChange={choosePhoto}
                />
                <Button
                  type="button"
                  variant="ghost"
                  className="h-[72px] w-[72px] shrink-0 overflow-hidden rounded-full border-dashed p-0"
                  onClick={() => photoInput.current?.click()}
                >
                  {showingPhoto ? (
                    <img src={photoPreview ?? ""} alt="" className="h-full w-full object-cover" />
                  ) : (
                    <Text variant="caption">Photo</Text>
                  )}
                </Button>
                <Stack className="gap-1">
                  <Stack direction="row" wrap className="gap-2">
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => photoInput.current?.click()}
                    >
                      {showingPhoto ? "Change photo" : "Upload photo"}
                    </Button>
                    {showingPhoto ? (
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="text-rose"
                        onClick={removePhoto}
                      >
                        Remove
                      </Button>
                    ) : null}
                  </Stack>
                  <Text variant="caption">JPG or PNG · shown on the doctors list</Text>
                </Stack>
              </Stack>
              <Grid>
                <TextField
                  label="Doctor code *"
                  id="doctor-code"
                  value={form.code}
                  autoFocus
                  autoComplete="off"
                  spellCheck={false}
                  placeholder="DR-ANU"
                  className="font-mono"
                  onChange={(code) => patch({ code })}
                />
                <Choice
                  id="doctor-status"
                  label="Status"
                  value={form.status}
                  options={[
                    { value: "active", label: "Active" },
                    { value: "inactive", label: "Inactive" },
                  ]}
                  placeholder=""
                  onChange={(status) =>
                    patch({ status: status === "inactive" ? "inactive" : "active" })
                  }
                />
                <TextField
                  label="First name *"
                  id="doctor-first"
                  value={form.firstName}
                  autoComplete="given-name"
                  placeholder="Anu"
                  onChange={(firstName) => patch({ firstName })}
                />
                <TextField
                  label="Last name *"
                  id="doctor-last"
                  value={form.lastName}
                  autoComplete="family-name"
                  placeholder="Rao"
                  onChange={(lastName) => patch({ lastName })}
                />
                <TextField
                  label="Display name *"
                  id="doctor-display"
                  value={form.displayName}
                  autoComplete="name"
                  placeholder="Dr Anu Rao"
                  onChange={(displayName) => patch({ displayName })}
                />
                <Choice
                  id="doctor-gender"
                  label="Gender *"
                  value={form.gender}
                  options={GENDERS}
                  onChange={(gender) => patch({ gender })}
                />
              </Grid>
              <Section title="Professional" />
              <Grid>
                <TextField
                  label="Medical registration number *"
                  id="doctor-registration"
                  value={form.registrationNumber}
                  autoComplete="off"
                  spellCheck={false}
                  placeholder="KMC-12345"
                  className="font-mono"
                  onChange={(registrationNumber) => patch({ registrationNumber })}
                />
                <TextField
                  label="Registration council"
                  id="doctor-council"
                  value={form.registrationCouncil}
                  placeholder="Karnataka Medical Council"
                  onChange={(registrationCouncil) => patch({ registrationCouncil })}
                />
                <Field label="Registration state" htmlFor="doctor-reg-state">
                  <StateSelect
                    id="doctor-reg-state"
                    value={form.registrationState}
                    onChange={(registrationState) => patch({ registrationState })}
                  />
                </Field>
                <TextField
                  label="Qualification *"
                  id="doctor-qualification"
                  value={form.qualification}
                  placeholder="MBBS"
                  onChange={(qualification) => patch({ qualification })}
                />
                <TextField
                  label="Specialization *"
                  id="doctor-specialization"
                  value={form.specialization}
                  placeholder="General medicine"
                  onChange={(specialization) => patch({ specialization })}
                />
                <TextField
                  label="Sub-specialization"
                  id="doctor-sub"
                  value={form.subSpecialization}
                  onChange={(subSpecialization) => patch({ subSpecialization })}
                />
                <TextField
                  label="Years of experience"
                  id="doctor-years"
                  value={form.yearsExperience}
                  inputMode="numeric"
                  placeholder="8"
                  onChange={(yearsExperience) => patch({ yearsExperience })}
                />
              </Grid>
              <Section title="Contact" />
              <Grid>
                <TextField
                  label="Primary mobile number *"
                  id="doctor-mobile"
                  value={form.primaryMobile}
                  type="tel"
                  inputMode="tel"
                  autoComplete="tel"
                  placeholder="+91 …"
                  onChange={(primaryMobile) => patch({ primaryMobile })}
                />
                <TextField
                  label="Alternate mobile number"
                  id="doctor-alt"
                  value={form.alternateMobile}
                  type="tel"
                  inputMode="tel"
                  autoComplete="tel"
                  placeholder="+91 …"
                  onChange={(alternateMobile) => patch({ alternateMobile })}
                />
                <TextField
                  label="Email address"
                  id="doctor-email"
                  value={form.email}
                  type="email"
                  inputMode="email"
                  autoComplete="email"
                  spellCheck={false}
                  placeholder="name@clinic.in"
                  onChange={(email) => patch({ email })}
                />
                <TextField
                  label="WhatsApp number"
                  id="doctor-whatsapp"
                  value={form.whatsapp}
                  type="tel"
                  inputMode="tel"
                  autoComplete="tel"
                  placeholder="+91 …"
                  onChange={(whatsapp) => patch({ whatsapp })}
                />
              </Grid>
              <Section title="Workplace" />
              <Grid>
                <TextField
                  label="Clinic / hospital name *"
                  id="doctor-workplace"
                  value={form.workplaceName}
                  autoComplete="organization"
                  placeholder="City Hospital"
                  onChange={(workplaceName) => patch({ workplaceName })}
                />
                <Choice
                  id="doctor-workplace-type"
                  label="Workplace type"
                  value={form.workplaceType}
                  options={WORKPLACE_TYPES}
                  onChange={(workplaceType) => patch({ workplaceType })}
                />
                <TextField
                  label="Address"
                  id="doctor-address"
                  value={form.address}
                  autoComplete="street-address"
                  fieldClassName="sm:col-span-2"
                  onChange={(address) => patch({ address })}
                />
                <TextField
                  label="City *"
                  id="doctor-city"
                  value={form.city}
                  autoComplete="address-level2"
                  placeholder="Bengaluru"
                  onChange={(city) => patch({ city })}
                />
                <Field label="State *" htmlFor="doctor-state">
                  <StateSelect
                    id="doctor-state"
                    value={form.state}
                    autoComplete="address-level1"
                    onChange={(state) => patch({ state })}
                  />
                </Field>
                <TextField
                  label="PIN code *"
                  id="doctor-pin"
                  value={form.pinCode}
                  inputMode="numeric"
                  autoComplete="postal-code"
                  spellCheck={false}
                  placeholder="560001"
                  onChange={(pinCode) => patch({ pinCode })}
                />
                <TextField
                  label="Contact number"
                  id="doctor-workplace-phone"
                  value={form.workplacePhone}
                  type="tel"
                  inputMode="tel"
                  autoComplete="tel"
                  placeholder="+91 …"
                  onChange={(workplacePhone) => patch({ workplacePhone })}
                />
              </Grid>
              <Section title="Consultation" />
              {form.windows.map((window, index) => (
                <Box key={index} className="rounded-md border border-line bg-wash-2 p-3.5">
                  <Stack direction="row" align="center" justify="between" className="mb-3 gap-2">
                    <Text className="text-[11.5px] font-extrabold tracking-[0.04em] text-muted uppercase">
                      Window {index + 1}
                    </Text>
                    {form.windows.length > 1 ? (
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="text-rose"
                        onClick={() =>
                          patch({ windows: form.windows.filter((_, item) => item !== index) })
                        }
                      >
                        Remove window
                      </Button>
                    ) : null}
                  </Stack>
                  <Stack className="gap-3">
                    <Field label="Consultation type">
                      <select
                        aria-label={`Consultation type ${index + 1}`}
                        className={selectClass}
                        value={window.type}
                        onChange={(event) =>
                          patchWindow(index, {
                            type: event.target.value as WindowDraft["type"],
                          })
                        }
                      >
                        {CONSULTATION_TYPES.map((item) => (
                          <option key={item.value} value={item.value}>
                            {item.label}
                          </option>
                        ))}
                      </select>
                    </Field>
                    <Stack className="gap-1.5">
                      <Text variant="label">Days</Text>
                      <Stack
                        direction="row"
                        wrap
                        className="gap-1.5"
                        role="group"
                        aria-label={`Days for window ${index + 1}`}
                      >
                        {DAYS.map((day) => {
                          const checked = window.days.includes(day.value);
                          return (
                            <label
                              key={day.value}
                              className={cn(
                                "inline-flex min-h-10 cursor-pointer items-center rounded-sm border px-3 text-[12.5px] font-bold has-[:focus-visible]:outline has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-offset-2 has-[:focus-visible]:outline-dark",
                                checked
                                  ? "border-mid bg-mid text-white"
                                  : "border-line-2 bg-paper text-ink-2 hover:border-[#b9d0c2]",
                              )}
                            >
                              <input
                                type="checkbox"
                                className="sr-only"
                                checked={checked}
                                onChange={() => toggleDay(index, day.value)}
                              />
                              <span aria-hidden="true">{DAY_SHORT[day.value]}</span>
                              <span className="sr-only">{day.label}</span>
                            </label>
                          );
                        })}
                      </Stack>
                      {window.days.length === 0 ? (
                        <Text className="text-[12px] font-bold text-rose">
                          Pick at least one day
                        </Text>
                      ) : null}
                    </Stack>
                    <Box className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                      <Field label="Start">
                        <Input
                          aria-label={`Start ${index + 1}`}
                          type="time"
                          step={60}
                          value={window.start}
                          onChange={(event) =>
                            patchWindow(index, { start: event.target.value.slice(0, 5) })
                          }
                        />
                      </Field>
                      <Field label="End">
                        <Input
                          aria-label={`End ${index + 1}`}
                          type="time"
                          step={60}
                          value={window.end}
                          onChange={(event) =>
                            patchWindow(index, { end: event.target.value.slice(0, 5) })
                          }
                        />
                      </Field>
                      <Field label="Fee (₹)">
                        <Input
                          aria-label={`Fee ${index + 1}`}
                          inputMode="decimal"
                          value={window.fee}
                          placeholder="0.00"
                          onChange={(event) => patchWindow(index, { fee: event.target.value })}
                        />
                      </Field>
                    </Box>
                  </Stack>
                </Box>
              ))}
              <Button
                type="button"
                variant="ghost"
                className="self-start"
                onClick={() => patch({ windows: [...form.windows, blankWindow()] })}
              >
                Add window
              </Button>
              <Section title="Relationship" />
              <Grid>
                <Choice
                  id="doctor-relationship"
                  label="Relationship status"
                  value={form.relationshipStatus}
                  options={RELATIONSHIPS}
                  onChange={(relationshipStatus) => patch({ relationshipStatus })}
                />
                <Field label="Internal notes" htmlFor="doctor-notes" className="sm:col-span-2">
                  <textarea
                    id="doctor-notes"
                    value={form.notes}
                    rows={3}
                    placeholder="Anything the dispensary should remember"
                    className={areaClass}
                    onChange={(event) => patch({ notes: event.target.value })}
                  />
                </Field>
              </Grid>
              <Section title="Documents" />
              {stored.length + pending.length === 0 ? (
                <Text
                  variant="muted"
                  className="rounded-md border border-dashed border-line-2 px-3 py-5 text-center"
                >
                  No documents yet. Attach a registration certificate or ID.
                </Text>
              ) : (
                <Stack className="overflow-hidden rounded-md border border-line bg-paper">
                  {stored.map((document) => (
                    <Stack
                      key={document.id}
                      direction="row"
                      align="center"
                      className="gap-3 border-b border-line px-3 py-2.5 last:border-b-0"
                    >
                      <Stack className="min-w-0 flex-1 gap-0.5">
                        <Text className="truncate text-[13px] font-bold">
                          {document.documentType}
                        </Text>
                        <Text variant="caption" className="truncate">
                          {document.fileName}
                        </Text>
                      </Stack>
                      <select
                        aria-label={`Verification status ${document.fileName}`}
                        className={cn(selectClass, "w-[148px] shrink-0")}
                        value={document.verificationStatus}
                        onChange={(event) =>
                          setStored((current) =>
                            current.map((item) =>
                              item.id === document.id
                                ? {
                                    ...item,
                                    verificationStatus: event.target.value as VerificationStatus,
                                  }
                                : item,
                            ),
                          )
                        }
                      >
                        {VERIFICATION.map((item) => (
                          <option key={item.value} value={item.value}>
                            {item.label}
                          </option>
                        ))}
                      </select>
                    </Stack>
                  ))}
                  {pending.map((document) => (
                    <Stack
                      key={`${document.documentType}-${document.file.name}`}
                      direction="row"
                      align="center"
                      className="gap-3 border-b border-line px-3 py-2.5 last:border-b-0"
                    >
                      <Stack className="min-w-0 flex-1 gap-0.5">
                        <Text className="truncate text-[13px] font-bold">
                          {document.documentType}
                        </Text>
                        <Text variant="caption" className="truncate">
                          {document.file.name}
                        </Text>
                      </Stack>
                      <Text variant="caption" className="shrink-0 font-bold">
                        {VERIFICATION.find((item) => item.value === document.verificationStatus)
                          ?.label ?? document.verificationStatus}
                      </Text>
                    </Stack>
                  ))}
                </Stack>
              )}
              <Grid>
                <Field label="Document type" htmlFor="doctor-doc-type">
                  <Input
                    ref={documentTypeInput}
                    id="doctor-doc-type"
                    value={pendingType}
                    placeholder="Medical registration certificate"
                    onChange={(event) => {
                      setPendingType(event.target.value);
                      if (documentHint) setDocumentHint(null);
                    }}
                  />
                </Field>
                <Field label="Verification status" htmlFor="doctor-doc-status">
                  <select
                    id="doctor-doc-status"
                    className={selectClass}
                    value={pendingStatus}
                    onChange={(event) => setPendingStatus(event.target.value as VerificationStatus)}
                  >
                    {VERIFICATION.map((item) => (
                      <option key={item.value} value={item.value}>
                        {item.label}
                      </option>
                    ))}
                  </select>
                </Field>
              </Grid>
              <Stack className="gap-1.5">
                <input
                  ref={documentInput}
                  id="doctor-doc-file"
                  type="file"
                  accept="image/jpeg,image/png,application/pdf"
                  aria-label="Document file"
                  tabIndex={-1}
                  className="sr-only"
                  onChange={chooseDocument}
                />
                <Button
                  type="button"
                  variant="ghost"
                  className="self-start"
                  onClick={attachDocument}
                >
                  Attach file
                </Button>
                <Text variant="caption">
                  JPG, PNG, or PDF. The type above is saved with the file.
                </Text>
                {documentHint ? (
                  <Text role="status" className="text-[12px] font-bold text-rose">
                    {documentHint}
                  </Text>
                ) : null}
              </Stack>
            </Stack>
          </Box>
          <Stack
            direction="row"
            align="center"
            justify="end"
            wrap
            className="shrink-0 gap-2 border-t border-line px-5 py-4"
          >
            <Text variant="caption" className="mr-auto">
              Fields marked * are required
            </Text>
            <Button type="button" variant="ghost" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" disabled={!canSave || saving}>
              {saving ? "Saving…" : doctor ? "Save changes" : "Save doctor"}
            </Button>
          </Stack>
        </form>
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

function Grid({ children }: { children: ReactNode }) {
  return <Box className="grid grid-cols-1 gap-3.5 sm:grid-cols-2">{children}</Box>;
}

function TextField({
  label,
  id,
  value,
  onChange,
  fieldClassName,
  className,
  ...inputProps
}: {
  label: string;
  id: string;
  value: string;
  onChange: (value: string) => void;
  fieldClassName?: string;
} & Omit<ComponentProps<typeof Input>, "id" | "value" | "onChange">) {
  return (
    <Field label={label} htmlFor={id} className={fieldClassName}>
      <Input
        id={id}
        value={value}
        className={className}
        onChange={(event) => onChange(event.target.value)}
        {...inputProps}
      />
    </Field>
  );
}

function Choice({
  id,
  label,
  value,
  options,
  onChange,
  placeholder = "Select",
  className,
}: {
  id: string;
  label: string;
  value: string;
  options: readonly { value: string; label: string }[];
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
}) {
  return (
    <Field label={label} htmlFor={id} className={className}>
      <select
        id={id}
        className={selectClass}
        value={value}
        onChange={(event) => onChange(event.target.value)}
      >
        {placeholder ? <option value="">{placeholder}</option> : null}
        {options.map((item) => (
          <option key={item.value} value={item.value}>
            {item.label}
          </option>
        ))}
      </select>
    </Field>
  );
}

function StateSelect({
  id,
  value,
  autoComplete,
  onChange,
}: {
  id: string;
  value: string;
  autoComplete?: string;
  onChange: (value: string) => void;
}) {
  return (
    <select
      id={id}
      autoComplete={autoComplete}
      className={selectClass}
      value={value}
      onChange={(event) => onChange(event.target.value)}
    >
      <option value="">Select</option>
      {REGIONS.map((region) => (
        <option key={region} value={region}>
          {region}
        </option>
      ))}
    </select>
  );
}
