import { useState, type ChangeEvent } from "react";
import type { Employee, PharmacyProfile } from "@/utils";
import { formatDayText } from "@/utils/date";
import { Box, Button, Checkbox, Image, Input, Label, Stack, Text } from "@/components/atoms";
import { IconPlus, IconPrint, IconUpload, IconX } from "@/components/atoms";
import { idCardValidThrough, readFileAsDataUrl } from "@/screens/Employees/Employees.utils";

const ACCENTS = [
  { key: "Forest", from: "#1B3D29", to: "#2F7D52" },
  { key: "Teal", from: "#0f3a3f", to: "#1f7d8c" },
  { key: "Blue", from: "#16305e", to: "#2563EB" },
  { key: "Violet", from: "#3a2d6e", to: "#6d4fc4" },
  { key: "Slate", from: "#1f2937", to: "#475569" },
  { key: "Gold", from: "#6a4a10", to: "#c9922f" },
];

import type { EmployeeIdCardProps } from "./EmployeeIdCard.types";
export function EmployeeIdCard({ employee, profile, onClose }: EmployeeIdCardProps) {
  const initials = employee.name.split(" ").map(function initial(word) { return word[0] ?? ""; }).join("").slice(0, 2).toUpperCase();
  const validThru = idCardValidThrough(employee.joinedOn);
  const [orient, setOrient] = useState<"landscape" | "portrait">("landscape");
  const [accent, setAccent] = useState(ACCENTS[0]);
  const [band, setBand] = useState("EMPLOYEE IDENTITY CARD");
  const [showBack, setShowBack] = useState(true);
  const [logo, setLogo] = useState<string | undefined>(profile.logo);

  function handleLogoChange(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;
    readFileAsDataUrl(file, setLogo);
    event.target.value = "";
  }

  function openLogoPicker() {
    document.getElementById("employee-logo-input")?.click();
  }

  function handleResetLogo() {
    setLogo(profile.logo);
  }

  function handleLandscape() {
    setOrient("landscape");
  }

  function handlePortrait() {
    setOrient("portrait");
  }

  function handleBandChange(event: ChangeEvent<HTMLInputElement>) {
    setBand(event.target.value);
  }

  function handleShowBack(event: ChangeEvent<HTMLInputElement>) {
    setShowBack(event.target.checked);
  }

  function handlePrint() {
    window.print();
  }

  const cardClass = orient === "portrait"
    ? "relative flex h-[340px] w-[214px] flex-col overflow-hidden rounded-[14px] border border-[#e1ece5] bg-white text-ink shadow-[0_8px_22px_rgba(27,61,41,.16)] print:h-[85.6mm] print:w-[53.98mm] print:break-inside-avoid print:border print:border-[#ccc] print:shadow-none"
    : "relative flex h-[214px] w-[340px] flex-col overflow-hidden rounded-[14px] border border-[#e1ece5] bg-white text-ink shadow-[0_8px_22px_rgba(27,61,41,.16)] print:h-[53.98mm] print:w-[85.6mm] print:break-inside-avoid print:border print:border-[#ccc] print:shadow-none";
  const bandClass = `px-3.5 py-3 text-white ${SWATCH_CLASS[accent.key] ?? SWATCH_CLASS.Forest}`;

  function bar(index: number) { return <Box key={index} className={`block h-[22px] bg-ink ${index % 3 === 0 ? "w-[3px]" : index % 2 === 0 ? "w-px opacity-80" : "w-0.5"}`} />; }
  return (
    <Box className="fixed inset-0 z-[200] flex items-center justify-center overflow-auto bg-[rgba(15,30,22,.55)] p-5" onClick={onClose}>
      <Box className="max-h-[94vh] w-full max-w-[780px] overflow-auto rounded-2xl bg-[#f3f7f4] shadow-[0_24px_60px_rgba(0,0,0,.3)]" onClick={stopCardClose}>
        <Stack direction="row" align="center" gap={2} className="sticky top-0 z-[3] gap-2 border-b border-[#dce7e0] bg-[#f3f7f4] px-4 py-3.5">
          <Text as="span" className="font-display text-sm font-extrabold text-dark">Digital Employee ID — {employee.name}</Text>
          <Box className="flex-1" />
          <Button className="!border !border-[#cfe0d6] !bg-white !px-[13px] !py-2 !text-[13px] !font-bold !text-dark !shadow-none !border-mid !bg-mid !text-white" onClick={handlePrint}><IconPrint size={14} /> Print / Save PDF</Button>
          <Button className="!border !border-[#cfe0d6] !bg-white !px-[13px] !py-2 !text-[13px] !font-bold !text-dark !shadow-none" onClick={onClose}><IconX size={13} /> Close</Button>
        </Stack>
        <Stack direction="row" align="center" wrap gap={4} className="border-b border-[#dce7e0] bg-[#eef4f0] px-4 py-[11px]">
          <Stack gap={1} className="gap-[5px]">
            <Label>Orientation</Label>
            <Stack direction="row" className="inline-flex overflow-hidden rounded-sm border border-[#cfe0d6] bg-white">
              <Button className={orient === "landscape" ? "!border-0 !bg-mid !text-white !shadow-none !rounded-none !px-[11px] !py-1.5 !text-[12.5px] !font-bold" : "!border-0 !bg-transparent !text-muted !shadow-none !rounded-none !px-[11px] !py-1.5 !text-[12.5px] !font-bold"} onClick={handleLandscape}>▭ Horizontal</Button>
              <Button className={orient === "portrait" ? "!border-0 !bg-mid !text-white !shadow-none !rounded-none !px-[11px] !py-1.5 !text-[12.5px] !font-bold" : "!border-0 !bg-transparent !text-muted !shadow-none !rounded-none !px-[11px] !py-1.5 !text-[12.5px] !font-bold"} onClick={handlePortrait}>▯ Vertical</Button>
            </Stack>
          </Stack>
          <Stack gap={1} className="gap-[5px]">
            <Label>Theme</Label>
            <AccentSwatches accent={accent.key} onSelect={setAccent} />
          </Stack>
          <Stack gap={1} className="gap-[5px]">
            <Label>Logo</Label>
            <Input id="employee-logo-input" type="file" accept="image/*" className="hidden" onChange={handleLogoChange} />
            <Button className="!border !border-[#cfe0d6] !bg-white !px-[13px] !py-2 !text-[13px] !font-bold !text-dark !shadow-none !px-[9px] !py-[5px] !text-xs" onClick={openLogoPicker}><IconUpload size={12} /> {logo ? "Change" : "Upload"}</Button>
            {logo && logo !== profile.logo ? <Button className="!border !border-[#cfe0d6] !bg-white !px-[13px] !py-2 !text-[13px] !font-bold !text-dark !shadow-none !px-[9px] !py-[5px] !text-xs" onClick={handleResetLogo}>Reset</Button> : null}
          </Stack>
          <Stack gap={1} className="gap-[5px] grow">
            <Label>Band text</Label>
            <Input className="w-full rounded-sm border border-[#cfe0d6] bg-white px-2.5 py-[7px] text-[13px] text-ink" value={band} onChange={handleBandChange} placeholder="EMPLOYEE IDENTITY CARD" aria-label="Band text" />
          </Stack>
          <Checkbox checked={showBack} onChange={handleShowBack}>Show back</Checkbox>
        </Stack>
        <Box className="print-area p-6 print:bg-white print:p-[14mm]" data-accent={accent.key}>
          <Box className="flex flex-wrap justify-center gap-6 print:gap-[10mm]">
            <Box className={cardClass}>
              <Text as="span" className="absolute top-2 right-2.5 z-[1] text-[8px] font-extrabold tracking-[0.12em] text-white/55 print:hidden">FRONT</Text>
              <Stack direction="row" align="center" gap={2} className={orient === "portrait" ? `${bandClass} flex-col text-center` : bandClass}>
                <LogoMark logo={logo} />
                <Box className="min-w-0">
                  <Text as="span" className="block font-display text-sm font-extrabold leading-tight text-inherit">{profile.name}</Text>
                  <Text as="span" className="text-[9.5px] text-inherit opacity-85">{profile.tagline || "Staff Identity Card"}</Text>
                </Box>
              </Stack>
              <Box className="truncate bg-gold px-1 py-[3px] text-center text-[9px] font-extrabold tracking-[0.14em] text-deep">{band || "EMPLOYEE IDENTITY CARD"}</Box>
              <Stack direction="row" gap={3} className="min-h-0 flex-1 px-3.5 py-3">
                <Box className="grid h-[86px] w-[72px] shrink-0 place-items-center overflow-hidden rounded-sm border border-[#cfe0d6] bg-wash font-display text-[26px] font-extrabold text-mid">
                  {employee.photo ? <Image src={employee.photo} alt={employee.name} fit="cover" /> : <Text as="span">{initials}</Text>}
                </Box>
                <Box className="min-w-0 flex-1">
                  <Text as="span" className="block font-display text-base font-extrabold leading-tight text-dark">{employee.name}</Text>
                  <Text as="span" className="mb-2 mt-0.5 block text-[11px] text-muted">{employee.position}{employee.department ? ` · ${employee.department}` : ""}</Text>
                  <Box className="grid grid-cols-2 gap-x-2.5 gap-y-[5px]">
                    <Fact label="ID" value={employee.id} mono />
                    <Fact label="Phone" value={employee.phone || "—"} />
                    <Fact label="Blood" value={employee.bloodGroup || "—"} />
                    <Fact label="Type" value={employee.employment} />
                  </Box>
                </Box>
              </Stack>
              <Stack direction="row" justify="between" className="mt-auto justify-between border-t border-[#e1ece5] bg-[#F0FAF4] px-3.5 py-[7px] text-[9px] text-muted">
                <Text as="span">Joined {formatDayText(employee.joinedOn || "")}</Text>
                <Text as="span">Valid thru {validThru}</Text>
              </Stack>
            </Box>
            {showBack ? (
              <Box className={`${cardClass} p-0`}>
                <Text as="span" className="absolute top-2 right-2.5 z-[1] text-[8px] font-extrabold tracking-[0.12em] text-ink/30 print:hidden">BACK</Text>
                <Stack direction="row" align="center" className={bandClass}>
                  <LogoMark logo={logo} small />
                  <Box className="min-w-0"><Text as="span" className="block font-display text-sm font-extrabold leading-tight text-inherit">{profile.name}</Text></Box>
                </Stack>
                <Box className="flex flex-1 flex-col gap-[5px] px-3.5 py-2.5 text-[10.5px]">
                  <BackRow label="Employee" value={`${employee.name} · ${employee.id}`} />
                  <BackRow label="Designation" value={employee.position} />
                  <BackRow label="Emergency contact" value={employee.emergencyName ? `${employee.emergencyName} · ${employee.emergencyPhone || ""}` : "—"} />
                  <BackRow label="Issued by" value={profile.name} />
                  <BackRow label="Address" value={profile.address || `${profile.city}, ${profile.state}`} wrap />
                  <BackRow label="Contact" value={profile.phone} />
                </Box>
                <Box className="flex h-[30px] items-center gap-[1.5px] px-3.5" aria-label={`barcode ${employee.id}`}>
                  {[0,1,2,3,4,5,6,7,8,9,10,11,12].map(bar)}
                  <Text as="span">{employee.id}</Text>
                </Box>
                <Box className="px-3.5 pb-3 pt-1.5 text-[7.5px] leading-snug text-faint">
                  <Box className="mb-1.5 flex flex-col items-end text-[8.5px] text-muted"><Box className="mb-0.5 block w-[110px] border-t border-faint" />Authorised signatory</Box>
                  <Text>If found, please return to the issuer above. This card remains the property of {profile.name} and must be surrendered on cessation of employment.</Text>
                </Box>
              </Box>
            ) : null}
          </Box>
        </Box>
      </Box>
    </Box>
  );
}

function stopCardClose(event: { stopPropagation: () => void }) {
  event.stopPropagation();
}

function LogoMark({ logo, small = false }: { logo?: string; small?: boolean }) {
  return (
    <Box className={small ? "grid h-[26px] w-[26px] shrink-0 place-items-center overflow-hidden rounded-sm bg-white text-mid" : "grid h-[34px] w-[34px] shrink-0 place-items-center overflow-hidden rounded-sm bg-white text-mid"}>
      {logo ? <Image src={logo} alt="" fit="contain" /> : <IconPlus size={small ? 14 : 18} />}
    </Box>
  );
}

function Fact({ label, value, mono = false }: { label: string; value: string; mono?: boolean }) {
  return (
    <Box>
      <Text as="span" className="text-[7.5px] font-bold uppercase tracking-[0.06em] text-faint">{label}</Text>
      <Text as="span" className={mono ? "text-[11px] font-bold text-ink font-mono" : "text-[11px] font-bold text-ink"}>{value}</Text>
    </Box>
  );
}

function BackRow({ label, value, wrap = false }: { label: string; value: string; wrap?: boolean }) {
  return (
    <Box>
      <Text as="span" className="text-[7.5px] font-bold uppercase tracking-[0.06em] text-faint">{label}</Text>
      <Text as="span" className={wrap ? "text-[11px] font-bold text-ink font-semibold" : "text-[11px] font-bold text-ink"}>{value}</Text>
    </Box>
  );
}

function AccentSwatches({ accent, onSelect }: { accent: string; onSelect: (accent: (typeof ACCENTS)[number]) => void }) {
  function renderSwatch(item: (typeof ACCENTS)[number]) {
    return <AccentSwatch key={item.key} item={item} selected={accent === item.key} onSelect={onSelect} />;
  }
  return (
    <Stack direction="row" gap={1} className="gap-1.5">
      {ACCENTS.map(renderSwatch)}
    </Stack>
  );
}

const SWATCH_CLASS: Record<string, string> = {
  Forest: "!bg-[linear-gradient(135deg,#1B3D29,#2F7D52)]",
  Teal: "!bg-[linear-gradient(135deg,#0f3a3f,#1f7d8c)]",
  Blue: "!bg-[linear-gradient(135deg,#16305e,#2563EB)]",
  Violet: "!bg-[linear-gradient(135deg,#3a2d6e,#6d4fc4)]",
  Slate: "!bg-[linear-gradient(135deg,#1f2937,#475569)]",
  Gold: "!bg-[linear-gradient(135deg,#6a4a10,#c9922f)]",
};

function swatchClass(key: string, selected: boolean) {
  const fill = SWATCH_CLASS[key] ?? "";
  const ring = selected
    ? "!border-dark !shadow-[0_0_0_2px_#fff,0_0_0_4px_#1B3D29]"
    : "!border-transparent";
  return `!h-6 !w-6 !min-h-6 !rounded-[7px] !border-2 !p-0 !shadow-[0_1px_3px_rgba(0,0,0,.15)] ${fill} ${ring}`;
}

function AccentSwatch({ item, selected, onSelect }: { item: (typeof ACCENTS)[number]; selected: boolean; onSelect: (accent: (typeof ACCENTS)[number]) => void }) {
  function handleSelect() {
    onSelect(item);
  }
  return <Button aria-label={item.key} title={item.key} data-accent={item.key} className={swatchClass(item.key, selected)} onClick={handleSelect} />;
}
