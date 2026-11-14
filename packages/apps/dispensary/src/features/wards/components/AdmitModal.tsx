import { useState } from "react";
import { Box } from "@/components/ui/Box";
import { Button } from "@/components/ui/Button";
import { IconCash, IconCheck } from "@/components/ui/Icon";
import { Input } from "@/components/ui/Input";
import { Label } from "@/components/ui/Label";
import { cn } from "@/utils/className";
import { INSURERS, freeBeds, suggestUhid, type Admission, type Ward } from "../model";
import { WardDialog } from "./WardDialog";

const field =
  "flex flex-col gap-1.5 [&_label]:text-[11.5px] [&_label]:font-bold [&_label]:tracking-wide [&_label]:text-ink-2";
const selectClass =
  "w-full rounded-sm border border-line-2 bg-paper px-3 py-[9px] text-[13.5px] text-ink outline-none focus:border-mid focus:shadow-focus";
const chip =
  "inline-flex h-auto items-center gap-[7px] rounded-full border border-line-2 bg-paper px-3.5 py-[7px] text-[12.5px] font-bold text-ink-2 shadow-none hover:border-[#b9d0c2] hover:bg-wash-2";

export function AdmitModal({
  wards,
  admissions,
  doctors,
  preset,
  error,
  onClose,
  onSave,
}: {
  wards: Ward[];
  admissions: Admission[];
  doctors: string[];
  preset: { wardId: string; bed: string } | null;
  error: string | null;
  onClose: () => void;
  onSave: (body: {
    name: string;
    uhid: string;
    phone: string | null;
    age: number | null;
    gender: "Male" | "Female" | "Other";
    wardId: string;
    bed: string;
    doctor: string | null;
    diagnosis: string | null;
    payerType: "self" | "insurance";
    insurer: string | null;
    policyNo: string | null;
  }) => void;
}) {
  const [wardId, setWardId] = useState(preset?.wardId ?? wards[0]?.id ?? "");
  const ward = wards.find((item) => item.id === wardId);
  const openBeds = ward ? freeBeds(ward, admissions) : [];
  const [bed, setBed] = useState(preset?.bed ?? openBeds[0] ?? "");
  const [form, setForm] = useState({
    name: "",
    uhid: suggestUhid(admissions.length),
    phone: "",
    age: "",
    gender: "Male" as "Male" | "Female" | "Other",
    doctor: doctors[0] ?? "",
    diagnosis: "",
    payerType: "self" as "self" | "insurance",
    insurer: INSURERS[0],
    policyNo: "",
  });
  const valid =
    form.name.trim() &&
    form.uhid.trim() &&
    ward &&
    bed &&
    (form.payerType === "self" || form.insurer);

  function pickWard(id: string) {
    setWardId(id);
    const next = wards.find((item) => item.id === id);
    const beds = next ? freeBeds(next, admissions) : [];
    setBed(beds[0] ?? "");
  }

  return (
    <WardDialog
      title="Admit patient"
      error={error}
      onClose={onClose}
      footer={
        <>
          <Button type="button" variant="ghost" onClick={onClose}>
            Cancel
          </Button>
          <Button
            type="button"
            disabled={!valid}
            onClick={() => {
              if (!valid || !ward) return;
              onSave({
                name: form.name.trim(),
                uhid: form.uhid.trim(),
                phone: form.phone.trim() || null,
                age: form.age ? Number(form.age) : null,
                gender: form.gender,
                wardId: ward.id,
                bed,
                doctor: form.doctor || null,
                diagnosis: form.diagnosis.trim() || null,
                payerType: form.payerType,
                insurer: form.payerType === "insurance" ? form.insurer : null,
                policyNo: form.payerType === "insurance" ? form.policyNo.trim() || null : null,
              });
            }}
          >
            <IconCheck size={15} /> Admit to {bed || "bed"}
          </Button>
        </>
      }
    >
      <Box className="grid grid-cols-2 gap-3.5 max-[767px]:grid-cols-1">
        <Box className={`${field} col-span-2 max-[767px]:col-span-1`}>
          <Label htmlFor="admit-name">Patient name *</Label>
          <Input
            id="admit-name"
            autoFocus
            value={form.name}
            placeholder="Full name"
            onChange={(event) => setForm({ ...form, name: event.target.value })}
          />
        </Box>
        <Box className={field}>
          <Label htmlFor="admit-uhid">Patient ID / UHID *</Label>
          <Input
            id="admit-uhid"
            className="font-mono"
            value={form.uhid}
            onChange={(event) => setForm({ ...form, uhid: event.target.value })}
          />
        </Box>
        <Box className={field}>
          <Label htmlFor="admit-phone">Phone</Label>
          <Input
            id="admit-phone"
            value={form.phone}
            placeholder="+91 …"
            onChange={(event) => setForm({ ...form, phone: event.target.value })}
          />
        </Box>
        <Box className={field}>
          <Label htmlFor="admit-age">Age</Label>
          <Input
            id="admit-age"
            type="number"
            min={0}
            value={form.age}
            onChange={(event) => setForm({ ...form, age: event.target.value })}
          />
        </Box>
        <Box className={field}>
          <Label htmlFor="admit-gender">Gender</Label>
          <select
            id="admit-gender"
            className={selectClass}
            value={form.gender}
            onChange={(event) =>
              setForm({ ...form, gender: event.target.value as "Male" | "Female" | "Other" })
            }
          >
            <option value="Male">Male</option>
            <option value="Female">Female</option>
            <option value="Other">Other</option>
          </select>
        </Box>
        <Box className={field}>
          <Label htmlFor="admit-ward">Ward *</Label>
          <select
            id="admit-ward"
            className={selectClass}
            value={wardId}
            onChange={(event) => pickWard(event.target.value)}
          >
            {wards.map((item) => (
              <option key={item.id} value={item.id}>
                {item.name} ({freeBeds(item, admissions).length} free)
              </option>
            ))}
          </select>
        </Box>
        <Box className={field}>
          <Label htmlFor="admit-bed">Bed *</Label>
          <select
            id="admit-bed"
            className={selectClass}
            value={bed}
            onChange={(event) => setBed(event.target.value)}
          >
            {openBeds.length === 0 ? <option value="">No free beds</option> : null}
            {openBeds.map((label) => (
              <option key={label} value={label}>
                {label}
              </option>
            ))}
          </select>
        </Box>
        <Box className={field}>
          <Label htmlFor="admit-doctor">Attending doctor</Label>
          <select
            id="admit-doctor"
            className={selectClass}
            value={form.doctor}
            onChange={(event) => setForm({ ...form, doctor: event.target.value })}
          >
            <option value="">—</option>
            {doctors.map((name) => (
              <option key={name} value={name}>
                {name}
              </option>
            ))}
          </select>
        </Box>
        <Box className={`${field} col-span-2 max-[767px]:col-span-1`}>
          <Label htmlFor="admit-diagnosis">Diagnosis / reason</Label>
          <Input
            id="admit-diagnosis"
            value={form.diagnosis}
            placeholder="e.g. Acute appendicitis"
            onChange={(event) => setForm({ ...form, diagnosis: event.target.value })}
          />
        </Box>
        <Box className={`${field} col-span-2 max-[767px]:col-span-1`}>
          <Label>Payer</Label>
          <Box className="flex items-center gap-1.5">
            <Button
              type="button"
              className={cn(
                chip,
                form.payerType === "self" && "border-dark bg-dark text-white hover:bg-dark",
              )}
              onClick={() => setForm({ ...form, payerType: "self" })}
            >
              <IconCash size={14} /> Self-pay
            </Button>
            <Button
              type="button"
              className={cn(
                chip,
                form.payerType === "insurance" && "border-dark bg-dark text-white hover:bg-dark",
              )}
              onClick={() => setForm({ ...form, payerType: "insurance" })}
            >
              Insurance / TPA
            </Button>
          </Box>
        </Box>
        {form.payerType === "insurance" ? (
          <>
            <Box className={field}>
              <Label htmlFor="admit-insurer">Insurer / TPA</Label>
              <select
                id="admit-insurer"
                className={selectClass}
                value={form.insurer}
                onChange={(event) => setForm({ ...form, insurer: event.target.value })}
              >
                {INSURERS.map((insurer) => (
                  <option key={insurer} value={insurer}>
                    {insurer}
                  </option>
                ))}
              </select>
            </Box>
            <Box className={field}>
              <Label htmlFor="admit-policy">Policy / claim no.</Label>
              <Input
                id="admit-policy"
                className="font-mono"
                value={form.policyNo}
                placeholder="Policy no."
                onChange={(event) => setForm({ ...form, policyNo: event.target.value })}
              />
            </Box>
          </>
        ) : null}
      </Box>
    </WardDialog>
  );
}
