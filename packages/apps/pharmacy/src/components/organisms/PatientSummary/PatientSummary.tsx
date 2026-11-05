import type { ReactNode } from "react";
import { Avatar } from "@/components/atoms/Avatar";
import { Box } from "@/components/atoms/Box";
import { Button } from "@/components/atoms/Button";
import { Heading } from "@/components/atoms/Heading";
import { Pill } from "@/components/atoms/Pill";
import { Stack } from "@/components/atoms/Stack";
import { Text } from "@/components/atoms/Text";
import { IconClock, IconMail, IconPhone, IconStethoscope, IconUser } from "@/components/atoms/Icon";
import { cn } from "@/utils/className";
import type { PatientSummaryProps } from "./PatientSummary.types";

function PatientMark({ name, initials }: { name: string; initials?: string }) {
  if (initials === "") {
    return (
      <Box className="grid h-12 w-12 shrink-0 place-items-center rounded-[13px] bg-mid text-white">
        <IconUser size={22} />
      </Box>
    );
  }
  return <Avatar name={name} initials={initials} size="lg" className="h-12 w-12 rounded-[13px] bg-mid text-white" />;
}

function ContactItem({ icon, children }: { icon: ReactNode; children: ReactNode }) {
  return (
    <Stack direction="row" align="center" gap={1}>
      {icon}
      <Text as="span" variant="caption" className="text-[12.5px]">
        {children}
      </Text>
    </Stack>
  );
}

function SegmentPill({ label }: { label: string }) {
  return <Pill tone="green">{label}</Pill>;
}

function SegmentPills({ segments }: { segments: string[] }) {
  return segments.map(function renderSegment(label) {
    return <SegmentPill key={label} label={label} />;
  });
}

function PatientBody({
  name,
  initials,
  phone,
  email,
  lastSeen,
  doctor,
  tier,
  chronic,
  kind,
  segments,
  asHeading,
}: Omit<PatientSummaryProps, "className" | "onOpen"> & { asHeading: boolean }) {
  return (
    <Stack direction="row" align="center" gap={3} className="min-w-0">
      <PatientMark name={name} initials={initials} />
      <Stack gap={1} className="min-w-0">
        <Stack direction="row" align="center" wrap gap={2}>
          {asHeading ? (
            <Heading level={3} className="text-[17px]">
              {name}
            </Heading>
          ) : (
            <Text as="span" className="font-display text-[15px] font-extrabold text-dark">
              {name}
            </Text>
          )}
          {tier ? <Pill tone="gold">{tier}</Pill> : null}
          {chronic ? <Pill tone="rose">chronic</Pill> : null}
          {kind ? <Pill tone="gray">{kind}</Pill> : null}
        </Stack>
        <Stack direction="row" align="center" wrap gap={3}>
          {phone !== undefined ? (
            <ContactItem icon={<IconPhone size={11} />}>{phone || "—"}</ContactItem>
          ) : null}
          {email ? <ContactItem icon={<IconMail size={11} />}>{email}</ContactItem> : null}
          {lastSeen ? <ContactItem icon={<IconClock size={11} />}>{lastSeen}</ContactItem> : null}
          {doctor ? <ContactItem icon={<IconStethoscope size={11} />}>{doctor}</ContactItem> : null}
        </Stack>
        {segments && segments.length > 0 ? (
          <Stack direction="row" wrap gap={1}>
            <SegmentPills segments={segments} />
          </Stack>
        ) : null}
      </Stack>
    </Stack>
  );
}

export function PatientSummary({
  name,
  initials,
  phone,
  email,
  lastSeen,
  doctor,
  tier,
  chronic,
  kind,
  segments,
  onOpen,
  className,
}: PatientSummaryProps) {
  function onOpenClick() {
    if (onOpen) onOpen();
  }
  if (onOpen) {
    return (
      <Button
        data-slot="patient-summary"
        variant="link"
        onClick={onOpenClick}
        className={cn("h-auto w-full justify-start px-0 py-0 whitespace-normal no-underline hover:no-underline", className)}
      >
        <PatientBody
          name={name}
          initials={initials}
          phone={phone}
          email={email}
          lastSeen={lastSeen}
          doctor={doctor}
          tier={tier}
          chronic={chronic}
          kind={kind}
          segments={segments}
          asHeading={false}
        />
      </Button>
    );
  }
  return (
    <Stack data-slot="patient-summary" className={className}>
      <PatientBody
        name={name}
        initials={initials}
        phone={phone}
        email={email}
        lastSeen={lastSeen}
        doctor={doctor}
        tier={tier}
        chronic={chronic}
        kind={kind}
        segments={segments}
        asHeading
      />
    </Stack>
  );
}
