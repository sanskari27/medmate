import { DOCTOR_STATUS_META } from "@/utils/calculations/hospital";
import { inr } from "@/utils";
import { Avatar, Box, Button, Heading, Pill, Stack, Text } from "@/components/atoms";
import { IconMail, IconPhone } from "@/components/atoms";
import { doctorStatusTone } from "@/screens/Doctors/Doctors.utils";

import type { DoctorCardProps } from "./DoctorCard.types";

export function DoctorCard({ doctor, onEdit }: DoctorCardProps) {
  const status = DOCTOR_STATUS_META[doctor.status];

  function handleEdit() {
    onEdit(doctor);
  }

  return (
    <Box className="rounded-md border border-line bg-paper p-[18px] !shadow-sm">
      <Stack direction="row" align="start" className="gap-[13px]">
        <Box className="grid h-[58px] w-[58px] shrink-0 place-items-center overflow-hidden rounded-[14px] border border-line-2 bg-wash">
          <Avatar
            name={doctor.name}
            src={doctor.photo}
            className="!h-11 !w-11 !rounded-[10px] !bg-mint !text-[17px] !font-extrabold !tracking-[-0.02em] !text-deep"
          />
        </Box>
        <Stack gap={0} className="min-w-0 flex-1">
          <Stack direction="row" align="start" justify="between" gap={2}>
            <Heading level={3} className="!text-[16px]">
              {doctor.name}
            </Heading>
            <Pill tone={doctorStatusTone(status.tone)}>{status.label}</Pill>
          </Stack>
          <Text variant="muted" className="mt-0.5 !text-[12.5px]">
            {doctor.qualification}
          </Text>
          <Pill tone="blue" className="mt-1.5 w-fit">
            {doctor.specialty}
          </Pill>
        </Stack>
      </Stack>
      <Box className="mt-3.5 grid grid-cols-2 gap-x-3.5 gap-y-2 border-t border-dashed border-line-2 pt-3 max-[767px]:grid-cols-1">
        <DoctorFact label="Department" value={doctor.department || "—"} />
        <DoctorFact label="Reg. no." value={doctor.regNo || "—"} mono />
        <DoctorFact label="Experience" value={`${doctor.experience} yrs`} />
        <DoctorFact label="OPD room" value={doctor.opdRoom || "—"} />
        <DoctorFact label="Consults" value={`${doctor.days} · ${doctor.timing}`} />
        <DoctorFact label="Fee" value={inr(doctor.fee)} />
        <DoctorFact label="Languages" value={doctor.languages} />
      </Box>
      {doctor.bio ? (
        <Text variant="muted" className="mt-2 !text-[12.5px] italic">
          {doctor.bio}
        </Text>
      ) : null}
      <Stack direction="row" align="center" wrap className="mt-3 gap-1.5">
        {doctor.phone ? (
          <Button asChild variant="ghost" size="sm">
            <a href={`tel:${doctor.phone}`}>
              <IconPhone size={14} /> {doctor.phone}
            </a>
          </Button>
        ) : null}
        {doctor.email ? (
          <Button asChild variant="ghost" size="sm">
            <a href={`mailto:${doctor.email}`}>
              <IconMail size={13} /> Email
            </a>
          </Button>
        ) : null}
        <Box className="flex-1" />
        <Button variant="ghost" size="sm" onClick={handleEdit}>
          Edit
        </Button>
      </Stack>
    </Box>
  );
}

function DoctorFact({
  label,
  value,
  mono = false,
}: {
  label: string;
  value: string;
  mono?: boolean;
}) {
  return (
    <Stack gap={0} className="min-w-0">
      <Text
        variant="caption"
        className="text-[10.5px] font-bold uppercase tracking-[0.05em] text-faint"
      >
        {label}
      </Text>
      <Text
        as="span"
        className={
          mono ? "font-mono text-[12.5px] font-bold text-ink" : "text-[12.5px] font-bold text-ink"
        }
      >
        {value}
      </Text>
    </Stack>
  );
}
