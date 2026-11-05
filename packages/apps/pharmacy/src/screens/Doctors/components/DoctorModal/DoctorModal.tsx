import { useState, type ChangeEvent } from "react";
import {
  DOCTOR_SPECIALTIES,
  blankDoctor,
  type DoctorProfile,
  type DoctorStatus,
} from "@/utils/calculations/hospital";
import { Avatar, Box, Button, Input, Select, Stack, Text, Textarea } from "@/components/atoms";
import { IconUpload } from "@/components/atoms";
import { Field } from "@/components/molecules/Field";
import { Modal } from "@/components/molecules/Modal";
import { doctorDraftIsValid, readImageFile } from "@/screens/Doctors/Doctors.utils";
import type { DoctorDraft } from "@/screens/Doctors/Doctors.types";

import type { DoctorModalProps } from "./DoctorModal.types";

export function DoctorModal({ initial, departments, onClose, onSave }: DoctorModalProps) {
  const [draft, setDraft] = useState<DoctorDraft>(
    initial ?? { ...blankDoctor(), department: departments[0] ?? "" },
  );

  function updateDraft(patch: Partial<DoctorDraft>) {
    setDraft(function mergeDraft(current) {
      return { ...current, ...patch };
    });
  }

  function handlePhotoChange(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;
    readImageFile(file, function applyPhoto(dataUrl) {
      updateDraft({ photo: dataUrl });
    });
  }

  function openPhotoPicker() {
    document.getElementById("doctor-photo-input")?.click();
  }

  function handleRemovePhoto() {
    updateDraft({ photo: undefined });
  }

  function handleNameChange(event: ChangeEvent<HTMLInputElement>) {
    updateDraft({ name: event.target.value });
  }

  function handleQualificationChange(event: ChangeEvent<HTMLInputElement>) {
    updateDraft({ qualification: event.target.value });
  }

  function handleSpecialtyChange(event: ChangeEvent<HTMLSelectElement>) {
    updateDraft({ specialty: event.target.value });
  }

  function handleDepartmentChange(event: ChangeEvent<HTMLSelectElement>) {
    updateDraft({ department: event.target.value });
  }

  function handleRegNoChange(event: ChangeEvent<HTMLInputElement>) {
    updateDraft({ regNo: event.target.value });
  }

  function handleGenderChange(event: ChangeEvent<HTMLSelectElement>) {
    updateDraft({ gender: event.target.value as DoctorProfile["gender"] });
  }

  function handleExperienceChange(event: ChangeEvent<HTMLInputElement>) {
    updateDraft({ experience: Number(event.target.value) || 0 });
  }

  function handlePhoneChange(event: ChangeEvent<HTMLInputElement>) {
    updateDraft({ phone: event.target.value });
  }

  function handleEmailChange(event: ChangeEvent<HTMLInputElement>) {
    updateDraft({ email: event.target.value });
  }

  function handleRoomChange(event: ChangeEvent<HTMLInputElement>) {
    updateDraft({ opdRoom: event.target.value });
  }

  function handleDaysChange(event: ChangeEvent<HTMLInputElement>) {
    updateDraft({ days: event.target.value });
  }

  function handleTimingChange(event: ChangeEvent<HTMLInputElement>) {
    updateDraft({ timing: event.target.value });
  }

  function handleFeeChange(event: ChangeEvent<HTMLInputElement>) {
    updateDraft({ fee: Number(event.target.value) || 0 });
  }

  function handleStatusChange(event: ChangeEvent<HTMLSelectElement>) {
    updateDraft({ status: event.target.value as DoctorStatus });
  }

  function handleLanguagesChange(event: ChangeEvent<HTMLInputElement>) {
    updateDraft({ languages: event.target.value });
  }

  function handleBioChange(event: ChangeEvent<HTMLTextAreaElement>) {
    updateDraft({ bio: event.target.value });
  }

  function handleSave() {
    onSave(draft);
  }

  const canSave = doctorDraftIsValid(draft);

  return (
    <Modal
      title={initial ? "Edit doctor" : "Add doctor"}
      size="lg"
      onClose={onClose}
      footer={
        <>
          <Button variant="ghost" onClick={onClose}>
            Cancel
          </Button>
          <Button variant="primary" disabled={!canSave} onClick={handleSave}>
            {initial ? "Save changes" : "Add doctor"}
          </Button>
        </>
      }
    >
      <Box>
        <Stack direction="row" align="center" className="mb-4 gap-4">
          <Input
            id="doctor-photo-input"
            type="file"
            accept="image/*"
            className="hidden"
            onChange={handlePhotoChange}
          />
          <Button
            variant="ghost"
            className="!grid !h-[84px] !w-[84px] !place-items-center !overflow-hidden !rounded-[18px] !border !border-line-2 !bg-wash !p-0 hover:!border-mid hover:!bg-wash"
            onClick={openPhotoPicker}
            title="Upload photo"
          >
            <Avatar
              name={draft.name}
              src={draft.photo}
              className="!h-16 !w-16 !rounded-[10px] !bg-mint !text-[25px] !font-extrabold !tracking-[-0.02em] !text-deep"
            />
          </Button>
          <Stack gap={0}>
            <Stack direction="row" className="gap-1.5">
              <Button variant="ghost" size="sm" onClick={openPhotoPicker}>
                <IconUpload size={13} /> {draft.photo ? "Change photo" : "Upload photo"}
              </Button>
              {draft.photo ? (
                <Button
                  variant="ghost"
                  size="sm"
                  className="!text-rose"
                  onClick={handleRemovePhoto}
                >
                  Remove
                </Button>
              ) : null}
            </Stack>
            <Text variant="caption" className="mt-1.5">
              Square photo works best · JPG/PNG
            </Text>
          </Stack>
        </Stack>
        <Box className="grid grid-cols-2 gap-3.5 max-[767px]:grid-cols-1">
          <Field
            label="Full name *"
            htmlFor="doctor-name"
            className="col-span-2 max-[767px]:col-span-1"
          >
            <Input
              id="doctor-name"
              data-field="name"
              autoFocus
              value={draft.name}
              onChange={handleNameChange}
              placeholder="Dr. …"
            />
          </Field>
          <Field label="Qualification" htmlFor="doctor-qualification">
            <Input
              id="doctor-qualification"
              value={draft.qualification}
              onChange={handleQualificationChange}
              placeholder="MBBS, MD…"
            />
          </Field>
          <Field label="Specialty" htmlFor="doctor-specialty">
            <Select
              id="doctor-specialty"
              value={draft.specialty}
              onChange={handleSpecialtyChange}
              options={[...SpecialtyOptions()]}
            />
          </Field>
          <Field label="Department" htmlFor="doctor-department">
            <Select
              id="doctor-department"
              value={draft.department}
              onChange={handleDepartmentChange}
              options={[
                { value: "", label: "\u2014 Select \u2014" },
                ...DepartmentOptions({ departments: departments }),
              ]}
            />
          </Field>
          <Field label="Medical Reg. No." htmlFor="doctor-reg">
            <Input
              id="doctor-reg"
              className="font-mono"
              value={draft.regNo}
              onChange={handleRegNoChange}
              placeholder="e.g. KMC-12345"
            />
          </Field>
          <Field label="Gender" htmlFor="doctor-gender">
            <Select
              id="doctor-gender"
              value={draft.gender}
              onChange={handleGenderChange}
              options={[
                { value: "Male", label: "Male" },
                { value: "Female", label: "Female" },
                { value: "Other", label: "Other" },
              ]}
            />
          </Field>
          <Field label="Experience (years)" htmlFor="doctor-experience">
            <Input
              id="doctor-experience"
              type="number"
              min={0}
              value={draft.experience || ""}
              onChange={handleExperienceChange}
            />
          </Field>
          <Field label="Phone" htmlFor="doctor-phone">
            <Input
              id="doctor-phone"
              data-field="phone"
              value={draft.phone}
              onChange={handlePhoneChange}
              placeholder="+91 …"
            />
          </Field>
          <Field label="Email" htmlFor="doctor-email">
            <Input
              id="doctor-email"
              data-field="email"
              value={draft.email}
              onChange={handleEmailChange}
              placeholder="doctor@hospital.in"
            />
          </Field>
          <Field label="OPD room" htmlFor="doctor-room">
            <Input
              id="doctor-room"
              value={draft.opdRoom}
              onChange={handleRoomChange}
              placeholder="OPD-1"
            />
          </Field>
          <Field label="Consulting days" htmlFor="doctor-days">
            <Input
              id="doctor-days"
              value={draft.days}
              onChange={handleDaysChange}
              placeholder="Mon–Sat"
            />
          </Field>
          <Field label="Consulting hours" htmlFor="doctor-timing">
            <Input
              id="doctor-timing"
              value={draft.timing}
              onChange={handleTimingChange}
              placeholder="10:00 AM – 1:00 PM"
            />
          </Field>
          <Field label="Consultation fee (₹)" htmlFor="doctor-fee">
            <Input
              id="doctor-fee"
              type="number"
              min={0}
              value={draft.fee || ""}
              onChange={handleFeeChange}
            />
          </Field>
          <Field label="Status" htmlFor="doctor-status">
            <Select
              id="doctor-status"
              value={draft.status}
              onChange={handleStatusChange}
              options={[
                { value: "active", label: "Available" },
                { value: "on-leave", label: "On leave" },
                { value: "visiting", label: "Visiting" },
              ]}
            />
          </Field>
          <Field
            label="Languages"
            htmlFor="doctor-languages"
            className="col-span-2 max-[767px]:col-span-1"
          >
            <Input
              id="doctor-languages"
              value={draft.languages}
              onChange={handleLanguagesChange}
              placeholder="English, Hindi, Kannada"
            />
          </Field>
          <Field
            label="About / notes"
            htmlFor="doctor-bio"
            className="col-span-2 max-[767px]:col-span-1"
          >
            <Textarea
              id="doctor-bio"
              value={draft.bio}
              onChange={handleBioChange}
              placeholder="Areas of expertise, achievements…"
            />
          </Field>
        </Box>
      </Box>
    </Modal>
  );
}

function SpecialtyOptions() {
  return DOCTOR_SPECIALTIES.map(renderSpecialty);
}

function renderSpecialty(specialty: string) {
  return { value: String(specialty), label: String(specialty) };
}

function DepartmentOptions({ departments }: { departments: string[] }) {
  return departments.map(renderDepartment);
}

function renderDepartment(name: string) {
  return { value: String(name), label: String(name) };
}
