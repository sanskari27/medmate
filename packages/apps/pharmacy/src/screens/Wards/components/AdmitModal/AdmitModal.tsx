import type { AdmitModalProps } from "./AdmitModal.types";
import type { DoctorProfile, Ward } from "@/utils";
import { Box, Button, Heading, Input, Label, Select } from "@/components/atoms";
import type { ChangeEvent, MouseEvent } from "react";
import { useState } from "react";
import { usePharma } from "@/hooks";
import { Admission, PayerType, wardBedNos, occupiedBedsOf, INSURERS, } from "@/utils/calculations/hospital";
import { IconX, IconCheck, IconCash, IconShield } from "@/components/Icon";
export function AdmitModal({ preset, onClose, onAdmitted, }: AdmitModalProps) {
    const { wards, admissions, doctors, admitPatient } = usePharma();
    const suggestUhid = `UHID-${100400 + admissions.length + 1}`;
    const [wardId, setWardId] = useState(preset?.wardId ?? wards[0]?.id ?? "");
    const ward = wards.find((w) => w.id === wardId);
    const freeBeds = ward
        ? wardBedNos(ward).filter((b) => !occupiedBedsOf(admissions, ward.id).has(b))
        : [];
    const [bed, setBed] = useState(preset?.bed ?? freeBeds[0] ?? "");
    const [f, setF] = useState({
        name: "",
        patientId: suggestUhid,
        age: "",
        gender: "Male" as Admission["gender"],
        phone: "",
        doctor: doctors[0]?.name ?? "",
        diagnosis: "",
        payerType: "self" as PayerType,
        insurer: INSURERS[0],
        policyNo: "",
    });
    const set = (p: Partial<typeof f>) => setF((s) => ({ ...s, ...p }));
    const pickWard = (id: string) => {
        setWardId(id);
        const w = wards.find((x) => x.id === id);
        const fb = w ? wardBedNos(w).filter((b) => !occupiedBedsOf(admissions, w.id).has(b)) : [];
        setBed(fb[0] ?? "");
    };
    const valid = f.name.trim() && f.patientId.trim() && ward && bed && (f.payerType === "self" || f.insurer);
    const save = async () => {
        if (!valid || !ward)
            return;
        const adm = await admitPatient({
            patientId: f.patientId.trim(),
            name: f.name.trim(),
            age: f.age ? Number(f.age) : undefined,
            gender: f.gender,
            phone: f.phone.trim(),
            wardId: ward.id,
            wardName: ward.name,
            bed,
            doctor: f.doctor,
            diagnosis: f.diagnosis,
            payerType: f.payerType,
            insurer: f.payerType === "insurance" ? f.insurer : undefined,
            policyNo: f.payerType === "insurance" ? f.policyNo : undefined,
        });
        if (!adm)
            return;
        onAdmitted(adm.id);
    };
    return (<Box className="!fixed !inset-0 !z-[100] !flex !items-center !justify-center !bg-[rgba(13,32,21,0.5)] !p-6 !backdrop-blur-[3px]" onClick={onClose}>
      <Box className="!flex !max-h-[90vh] !w-full !max-w-[720px] !flex-col !overflow-hidden !rounded-lg !bg-paper !shadow-pop" onClick={stopPropagationOnClick}>
        <Box className="!flex !items-center !justify-between !border-b !border-line !px-5 !py-4 [&_h3]:!text-[17px]">
          <Heading level={3}>Admit patient</Heading>
          <Button className="!grid !h-8 !w-8 !place-items-center !rounded-xs !border !border-line-2 !bg-paper !text-ink-2 hover:!bg-wash-2 hover:!text-mid" onClick={onClose}>
            <IconX size={18}/>
          </Button>
        </Box>
        <Box className="!overflow-y-auto !p-5">
          <Box className="!grid !grid-cols-2 !gap-3.5 max-[767px]:!grid-cols-1">
            <Box className="!flex !flex-col !gap-1.5 [&_label]:!text-[11.5px] [&_label]:!font-bold [&_label]:!tracking-wide [&_label]:!text-ink-2 !col-span-2 max-[767px]:!col-span-1" data-field="name">
              <Label>Patient name *</Label>
              <Input className="" autoFocus value={f.name} onChange={setOnChange} placeholder="Full name"/>
            </Box>
            <Box className="!flex !flex-col !gap-1.5 [&_label]:!text-[11.5px] [&_label]:!font-bold [&_label]:!tracking-wide [&_label]:!text-ink-2">
              <Label>Patient ID / UHID *</Label>
              <Input className="!font-mono" value={f.patientId} onChange={setOnChange2}/>
            </Box>
            <Box className="!flex !flex-col !gap-1.5 [&_label]:!text-[11.5px] [&_label]:!font-bold [&_label]:!tracking-wide [&_label]:!text-ink-2" data-field="phone">
              <Label>Phone</Label>
              <Input className="" value={f.phone} onChange={setOnChange3} placeholder="+91 …"/>
            </Box>
            <Box className="!flex !flex-col !gap-1.5 [&_label]:!text-[11.5px] [&_label]:!font-bold [&_label]:!tracking-wide [&_label]:!text-ink-2">
              <Label>Age</Label>
              <Input className="" type="number" min={0} value={f.age} onChange={setOnChange4}/>
            </Box>
            <Box className="!flex !flex-col !gap-1.5 [&_label]:!text-[11.5px] [&_label]:!font-bold [&_label]:!tracking-wide [&_label]:!text-ink-2">
              <Label>Gender</Label>
              <Select className="" value={f.gender} onChange={setOnChange5} options={[{ value: "Male", label: "Male" }, { value: "Female", label: "Female" }, { value: "Other", label: "Other" }]} />
            </Box>
            <Box className="!flex !flex-col !gap-1.5 [&_label]:!text-[11.5px] [&_label]:!font-bold [&_label]:!tracking-wide [&_label]:!text-ink-2">
              <Label>Ward *</Label>
              <Select className="" value={wardId} onChange={pickWardOnChange} options={[...(wards.map(renderWard))]} />
            </Box>
            <Box className="!flex !flex-col !gap-1.5 [&_label]:!text-[11.5px] [&_label]:!font-bold [&_label]:!tracking-wide [&_label]:!text-ink-2">
              <Label>Bed *</Label>
              <Select className="" value={bed} onChange={setBedOnChange} options={[...(!freeBeds.length ? [{ value: "", label: "No free beds" }] : []), ...[
            ...(preset && !freeBeds.includes(preset.bed) ? [preset.bed] : []),
            ...freeBeds,
        ].map(renderB)]} />
            </Box>
            <Box className="!flex !flex-col !gap-1.5 [&_label]:!text-[11.5px] [&_label]:!font-bold [&_label]:!tracking-wide [&_label]:!text-ink-2">
              <Label>Attending doctor</Label>
              <Select className="" value={f.doctor} onChange={setOnChange6} options={[{ value: "", label: "\u2014" }, ...doctors.map(renderDoctor)]} />
            </Box>
            <Box className="!flex !flex-col !gap-1.5 [&_label]:!text-[11.5px] [&_label]:!font-bold [&_label]:!tracking-wide [&_label]:!text-ink-2 !col-span-2 max-[767px]:!col-span-1">
              <Label>Diagnosis / reason</Label>
              <Input className="" value={f.diagnosis} onChange={setOnChange7} placeholder="e.g. Acute appendicitis"/>
            </Box>
            <Box className="!flex !flex-col !gap-1.5 [&_label]:!text-[11.5px] [&_label]:!font-bold [&_label]:!tracking-wide [&_label]:!text-ink-2 !col-span-2 max-[767px]:!col-span-1">
              <Label>Payer</Label>
              <Box className="!flex !items-center !gap-1.5">
                <Button className={`!inline-flex !h-auto !items-center !gap-[7px] !rounded-full !border !border-line-2 !bg-paper !px-3.5 !py-[7px] !text-[12.5px] !font-bold !text-ink-2 !shadow-none hover:!border-[#b9d0c2] hover:!bg-wash-2 ${f.payerType === "self" ? " !border-dark !bg-dark !text-white hover:!bg-dark" : ""}`} onClick={setOnClick}>
                  <IconCash size={14}/> Self-pay
                </Button>
                <Button className={`!inline-flex !h-auto !items-center !gap-[7px] !rounded-full !border !border-line-2 !bg-paper !px-3.5 !py-[7px] !text-[12.5px] !font-bold !text-ink-2 !shadow-none hover:!border-[#b9d0c2] hover:!bg-wash-2 ${f.payerType === "insurance" ? " !border-dark !bg-dark !text-white hover:!bg-dark" : ""}`} onClick={setOnClick2}>
                  <IconShield size={14}/> Insurance / TPA
                </Button>
              </Box>
            </Box>
            {f.payerType === "insurance" && (<>
                <Box className="!flex !flex-col !gap-1.5 [&_label]:!text-[11.5px] [&_label]:!font-bold [&_label]:!tracking-wide [&_label]:!text-ink-2">
                  <Label>Insurer / TPA</Label>
                  <Select className="" value={f.insurer} onChange={setOnChange8} options={[...(INSURERS.map(renderINSURERS))]} />
                </Box>
                <Box className="!flex !flex-col !gap-1.5 [&_label]:!text-[11.5px] [&_label]:!font-bold [&_label]:!tracking-wide [&_label]:!text-ink-2">
                  <Label>Policy / claim no.</Label>
                  <Input className="!font-mono" value={f.policyNo} onChange={setOnChange9} placeholder="Policy no."/>
                </Box>
              </>)}
          </Box>
        </Box>
        <Box className="!mt-auto !flex !justify-end !gap-2.5 !border-t !border-line !px-5 !py-3.5">
          <Box className="!flex-1"/>
          <Button className="!border !border-line-2 !bg-paper !text-ink-2 !shadow-none hover:!bg-wash-2" onClick={onClose}>
            Cancel
          </Button>
          <Button className="!border-transparent !bg-mid !text-white !shadow-sm hover:!bg-green" disabled={!valid} onClick={save}>
            <IconCheck size={15}/> Admit to {bed || "bed"}
          </Button>
        </Box>
      </Box>
    </Box>);
    function stopPropagationOnClick(e: MouseEvent<HTMLDivElement>) {
        return e.stopPropagation();
    }
    function setOnChange(e: ChangeEvent<HTMLInputElement>) {
        return set({ name: e.target.value });
    }
    function setOnChange2(e: ChangeEvent<HTMLInputElement>) {
        return set({ patientId: e.target.value });
    }
    function setOnChange3(e: ChangeEvent<HTMLInputElement>) {
        return set({ phone: e.target.value });
    }
    function setOnChange4(e: ChangeEvent<HTMLInputElement>) {
        return set({ age: e.target.value });
    }
    function setOnChange5(e: ChangeEvent<HTMLSelectElement>) {
        return set({ gender: e.target.value as Admission["gender"] });
    }
    function pickWardOnChange(e: ChangeEvent<HTMLSelectElement>) {
        return pickWard(e.target.value);
    }
    function renderWard(w: Ward) {
        return { value: String(w.id), label: String(w.name) + " (" + String(wardBedNos(w).filter(matchB).length) + " free)" };
        function matchB(b: string) {
            return !occupiedBedsOf(admissions, w.id).has(b);
        }
    }
    function setBedOnChange(e: ChangeEvent<HTMLSelectElement>) {
        return setBed(e.target.value);
    }
    function renderB(b: string) {
        return { value: String(b), label: String(b) };
    }
    function setOnChange6(e: ChangeEvent<HTMLSelectElement>) {
        return set({ doctor: e.target.value });
    }
    function renderDoctor(d: DoctorProfile) {
        return { value: String(d.name), label: String(d.name) };
    }
    function setOnChange7(e: ChangeEvent<HTMLInputElement>) {
        return set({ diagnosis: e.target.value });
    }
    function setOnClick() {
        return set({ payerType: "self" });
    }
    function setOnClick2() {
        return set({ payerType: "insurance" });
    }
    function setOnChange8(e: ChangeEvent<HTMLSelectElement>) {
        return set({ insurer: e.target.value });
    }
    function renderINSURERS(i: string) {
        return { value: String(i), label: String(i) };
    }
    function setOnChange9(e: ChangeEvent<HTMLInputElement>) {
        return set({ policyNo: e.target.value });
    }
}
