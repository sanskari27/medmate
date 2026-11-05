import { useState, type ChangeEvent } from "react";
import { formatDayText } from "@/utils/date";
import { Box, Button, Image, Input, Label, Stack, Text } from "@/components/atoms";
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
  const initials = employee.name
    .split(" ")
    .map(function initial(word) {
      return word[0] ?? "";
    })
    .join("")
    .slice(0, 2)
    .toUpperCase();
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

  const portrait = orient === "portrait";
  const cardClass = portrait
    ? "relative flex h-[340px] w-[214px] flex-col overflow-hidden rounded-[14px] border border-[#e1ece5] bg-white text-ink shadow-[0_8px_22px_rgba(27,61,41,.16)] print:h-[85.6mm] print:w-[53.98mm] print:break-inside-avoid print:border print:border-[#ccc] print:shadow-none"
    : "relative flex h-[214px] w-[340px] flex-col overflow-hidden rounded-[14px] border border-[#e1ece5] bg-white text-ink shadow-[0_8px_22px_rgba(27,61,41,.16)] print:h-[53.98mm] print:w-[85.6mm] print:break-inside-avoid print:border print:border-[#ccc] print:shadow-none";
  const bandClass = `text-white ${SWATCH_CLASS[accent.key] ?? SWATCH_CLASS.Forest}`;

  function bar(index: number) {
    const n = index + 1;
    const wide = n % 3 === 0;
    const thin = !wide && n % 2 === 0;
    return (
      <Box
        key={index}
        className={`block h-[22px] bg-ink ${wide ? "w-[3px]" : thin ? "w-px opacity-80" : "w-0.5"}`}
      />
    );
  }
  return (
    <Box
      className="fixed inset-0 z-[200] flex items-center justify-center overflow-auto bg-[rgba(15,30,22,.55)] p-5"
      onClick={onClose}
    >
      <style>{PRINT_CSS}</style>
      <Box
        className="max-h-[94vh] w-full max-w-[780px] overflow-auto rounded-2xl bg-[#f3f7f4] shadow-[0_24px_60px_rgba(0,0,0,.3)]"
        onClick={stopCardClose}
      >
        <Stack
          direction="row"
          align="center"
          gap={2}
          className="sticky top-0 z-[3] gap-2 border-b border-[#dce7e0] bg-[#f3f7f4] px-4 py-3.5"
        >
          <Text as="span" className="font-display text-sm font-extrabold text-dark">
            Digital Employee ID — {employee.name}
          </Text>
          <Box className="flex-1" />
          <Button
            variant="primary"
            className="!gap-[5px] !rounded-[9px] !px-[13px] !py-2 !text-[13px] hover:!bg-mid"
            onClick={handlePrint}
          >
            <IconPrint size={14} /> Print / Save PDF
          </Button>
          <Button
            variant="ghost"
            className="!gap-[5px] !rounded-[9px] !border !border-[#cfe0d6] !bg-white !px-[13px] !py-2 !text-[13px] !text-dark !shadow-none hover:!bg-white hover:!text-dark"
            onClick={onClose}
          >
            <IconX size={13} /> Close
          </Button>
        </Stack>
        <Stack
          direction="row"
          align="center"
          wrap
          gap={4}
          className="border-b border-[#dce7e0] bg-[#eef4f0] px-4 py-[11px]"
        >
          <Stack gap={1} className="gap-[5px]">
            <Label className="!text-[9.5px] !font-extrabold !tracking-[0.06em] !text-[#6a8a78] !uppercase">
              Orientation
            </Label>
            <Stack
              direction="row"
              className="inline-flex overflow-hidden rounded-sm border border-[#cfe0d6] bg-white"
            >
              <Button
                className={
                  orient === "landscape"
                    ? "!rounded-none !border-0 !bg-mid !px-[11px] !py-1.5 !text-[12.5px] !font-bold !text-white !shadow-none hover:!bg-mid hover:!text-white active:!translate-y-0"
                    : "!rounded-none !border-0 !bg-transparent !px-[11px] !py-1.5 !text-[12.5px] !font-bold !text-muted !shadow-none hover:!bg-transparent hover:!text-muted active:!translate-y-0"
                }
                onClick={handleLandscape}
              >
                ▭ Horizontal
              </Button>
              <Button
                className={
                  orient === "portrait"
                    ? "!rounded-none !border-0 !bg-mid !px-[11px] !py-1.5 !text-[12.5px] !font-bold !text-white !shadow-none hover:!bg-mid hover:!text-white active:!translate-y-0"
                    : "!rounded-none !border-0 !bg-transparent !px-[11px] !py-1.5 !text-[12.5px] !font-bold !text-muted !shadow-none hover:!bg-transparent hover:!text-muted active:!translate-y-0"
                }
                onClick={handlePortrait}
              >
                ▯ Vertical
              </Button>
            </Stack>
          </Stack>
          <Stack gap={1} className="gap-[5px]">
            <Label className="!text-[9.5px] !font-extrabold !tracking-[0.06em] !text-[#6a8a78] !uppercase">
              Theme
            </Label>
            <AccentSwatches accent={accent.key} onSelect={setAccent} />
          </Stack>
          <Stack gap={1} className="gap-[5px]">
            <Label className="!text-[9.5px] !font-extrabold !tracking-[0.06em] !text-[#6a8a78] !uppercase">
              Logo
            </Label>
            <Input
              id="employee-logo-input"
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handleLogoChange}
            />
            <Button
              variant="ghost"
              className="!gap-[5px] !rounded-[9px] !border !border-[#cfe0d6] !bg-white !px-[9px] !py-[5px] !text-xs !text-dark !shadow-none hover:!bg-white hover:!text-dark"
              onClick={openLogoPicker}
            >
              <IconUpload size={12} /> {logo ? "Change" : "Upload"}
            </Button>
            {logo && logo !== profile.logo ? (
              <Button
                variant="ghost"
                className="!rounded-[9px] !border !border-[#cfe0d6] !bg-white !px-[9px] !py-[5px] !text-xs !text-dark !shadow-none hover:!bg-white hover:!text-dark"
                onClick={handleResetLogo}
              >
                Reset
              </Button>
            ) : null}
          </Stack>
          <Stack gap={1} className="gap-[5px] grow">
            <Label className="!text-[9.5px] !font-extrabold !tracking-[0.06em] !text-[#6a8a78] !uppercase">
              Band text
            </Label>
            <Input
              className="w-full rounded-sm border border-[#cfe0d6] bg-white px-2.5 py-[7px] text-[13px] text-ink"
              value={band}
              onChange={handleBandChange}
              placeholder="EMPLOYEE IDENTITY CARD"
              aria-label="Band text"
            />
          </Stack>
          <label className="mb-1.5 flex items-center gap-1.5 self-end text-[12.5px] font-bold text-dark">
            <input type="checkbox" checked={showBack} onChange={handleShowBack} /> Show back
          </label>
        </Stack>
        <Box className="idc-print-area p-6 print:bg-white print:p-[14mm]" data-accent={accent.key}>
          <Box className="idc-cards flex flex-wrap justify-center gap-6">
            <Box className={cardClass}>
              <Text
                as="span"
                className="absolute top-2 right-2.5 z-[1] text-[8px] font-extrabold tracking-[0.12em] text-white/55 print:hidden"
              >
                FRONT
              </Text>
              <Stack
                direction={portrait ? "column" : "row"}
                align="center"
                gap={portrait ? 1 : 2}
                className={
                  portrait
                    ? `${bandClass} px-3 pt-[9px] pb-[7px] text-center`
                    : `${bandClass} gap-[9px] px-3.5 py-3`
                }
              >
                <LogoMark logo={logo} />
                <Box className="min-w-0">
                  <Text
                    as="span"
                    className="block font-display text-sm font-extrabold leading-tight text-inherit"
                  >
                    {profile.name}
                  </Text>
                  <Text
                    as="span"
                    className={
                      portrait
                        ? "text-[8px] text-inherit opacity-85"
                        : "text-[9.5px] text-inherit opacity-85"
                    }
                  >
                    {profile.tagline || "Staff Identity Card"}
                  </Text>
                </Box>
              </Stack>
              <Box className="truncate bg-gold px-1 py-[3px] text-center text-[9px] font-extrabold tracking-[0.14em] text-deep">
                {band || "EMPLOYEE IDENTITY CARD"}
              </Box>
              <Stack
                direction={portrait ? "column" : "row"}
                align={portrait ? "center" : "start"}
                className={
                  portrait
                    ? "min-h-0 w-full flex-1 gap-1.5 px-3 py-2 text-center"
                    : "min-h-0 flex-1 gap-3 px-3.5 py-3"
                }
              >
                <Box
                  className={
                    portrait
                      ? "grid h-[90px] w-[76px] shrink-0 place-items-center overflow-hidden rounded-sm border border-[#cfe0d6] bg-wash font-display text-[26px] font-extrabold text-mid"
                      : "grid h-[86px] w-[72px] shrink-0 place-items-center overflow-hidden rounded-sm border border-[#cfe0d6] bg-wash font-display text-[26px] font-extrabold text-mid"
                  }
                >
                  {employee.photo ? (
                    <Image src={employee.photo} alt={employee.name} fit="cover" />
                  ) : (
                    <Text as="span">{initials}</Text>
                  )}
                </Box>
                <Box className={portrait ? "w-full min-w-0 flex-1" : "min-w-0 flex-1"}>
                  <Text
                    as="span"
                    className={
                      portrait
                        ? "block text-center font-display text-base font-extrabold leading-tight text-dark"
                        : "block font-display text-base font-extrabold leading-tight text-dark"
                    }
                  >
                    {employee.name}
                  </Text>
                  <Text
                    as="span"
                    className={
                      portrait
                        ? "mt-0.5 mb-1.5 block text-center text-[11px] text-muted"
                        : "mt-0.5 mb-2 block text-[11px] text-muted"
                    }
                  >
                    {employee.position}
                    {employee.department ? ` · ${employee.department}` : ""}
                  </Text>
                  <Box
                    className={
                      portrait
                        ? "grid grid-cols-2 gap-x-3 gap-y-[5px] text-left"
                        : "grid grid-cols-2 gap-x-2.5 gap-y-[5px]"
                    }
                  >
                    <Fact label="ID" value={employee.id} mono />
                    <Fact label="Phone" value={employee.phone || "—"} />
                    <Fact label="Blood" value={employee.bloodGroup || "—"} />
                    <Fact label="Type" value={employee.employment} />
                  </Box>
                </Box>
              </Stack>
              <Stack
                direction="row"
                justify="between"
                className={
                  portrait
                    ? "mt-auto justify-between border-t border-[#e1ece5] bg-[#F0FAF4] px-3.5 py-[5px] text-[9px] text-muted"
                    : "mt-auto justify-between border-t border-[#e1ece5] bg-[#F0FAF4] px-3.5 py-[7px] text-[9px] text-muted"
                }
              >
                <Text as="span">Joined {formatDayText(employee.joinedOn || "")}</Text>
                <Text as="span">Valid thru {validThru}</Text>
              </Stack>
            </Box>
            {showBack ? (
              <Box className={`${cardClass} p-0`}>
                <Text
                  as="span"
                  className="absolute top-2 right-2.5 z-[1] text-[8px] font-extrabold tracking-[0.12em] text-ink/30 print:hidden"
                >
                  BACK
                </Text>
                <Stack
                  direction="row"
                  align="center"
                  className={`${bandClass} gap-[9px] px-3.5 py-[9px] text-left`}
                >
                  <LogoMark logo={logo} small />
                  <Box className="min-w-0">
                    <Text
                      as="span"
                      className="block font-display text-sm font-extrabold leading-tight text-inherit"
                    >
                      {profile.name}
                    </Text>
                  </Box>
                </Stack>
                <Box
                  className={
                    portrait
                      ? "flex flex-1 flex-col gap-1 px-3 py-[9px]"
                      : "flex flex-1 flex-col gap-[5px] px-3.5 py-2.5"
                  }
                >
                  <BackRow
                    compact={portrait}
                    label="Employee"
                    value={`${employee.name} · ${employee.id}`}
                  />
                  <BackRow compact={portrait} label="Designation" value={employee.position} />
                  <BackRow
                    compact={portrait}
                    label="Emergency contact"
                    value={
                      employee.emergencyName
                        ? `${employee.emergencyName} · ${employee.emergencyPhone || ""}`
                        : "—"
                    }
                  />
                  <BackRow compact={portrait} label="Issued by" value={profile.name} />
                  <BackRow
                    compact={portrait}
                    label="Address"
                    value={profile.address || `${profile.city}, ${profile.state}`}
                    wrap
                  />
                  <BackRow compact={portrait} label="Contact" value={profile.phone} />
                </Box>
                <Box
                  className="flex h-[30px] items-center gap-[1.5px] px-3.5"
                  aria-label={`barcode ${employee.id}`}
                >
                  {[0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12].map(bar)}
                  <Text as="span" className="ml-2 font-mono text-[9px] tracking-[0.12em] text-ink">
                    {employee.id}
                  </Text>
                </Box>
                <Box
                  className={
                    portrait
                      ? "px-3 pt-1 pb-[9px] text-[7px] leading-snug text-faint"
                      : "px-3.5 pt-1.5 pb-3 text-[7.5px] leading-snug text-faint"
                  }
                >
                  <Box
                    className={
                      portrait
                        ? "mb-1 flex flex-col items-end text-[8.5px] text-muted"
                        : "mb-1.5 flex flex-col items-end text-[8.5px] text-muted"
                    }
                  >
                    <Box className="mb-0.5 block w-[110px] border-t border-faint" />
                    Authorised signatory
                  </Box>
                  <Text>
                    If found, please return to the issuer above. This card remains the property of{" "}
                    {profile.name} and must be surrendered on cessation of employment.
                  </Text>
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
    <Box
      className={
        small
          ? "grid h-[26px] w-[26px] shrink-0 place-items-center overflow-hidden rounded-sm bg-white text-mid"
          : "grid h-[34px] w-[34px] shrink-0 place-items-center overflow-hidden rounded-sm bg-white text-mid"
      }
    >
      {logo ? <Image src={logo} alt="" fit="contain" /> : <IconPlus size={small ? 14 : 18} />}
    </Box>
  );
}

function Fact({ label, value, mono = false }: { label: string; value: string; mono?: boolean }) {
  return (
    <Box>
      <Text as="span" className="text-[7.5px] font-bold uppercase tracking-[0.06em] text-faint">
        {label}
      </Text>
      <Text
        as="span"
        className={
          mono ? "text-[11px] font-bold text-ink font-mono" : "text-[11px] font-bold text-ink"
        }
      >
        {value}
      </Text>
    </Box>
  );
}

function BackRow({
  label,
  value,
  wrap = false,
  compact = false,
}: {
  label: string;
  value: string;
  wrap?: boolean;
  compact?: boolean;
}) {
  return (
    <Box
      className={compact ? "flex gap-2 text-[9.5px] leading-[1.25]" : "flex gap-2 text-[10.5px]"}
    >
      <Text
        as="span"
        className={
          compact
            ? "!w-[62px] !shrink-0 !text-[9.5px] !font-bold !text-faint"
            : "!w-24 !shrink-0 !text-[10.5px] !font-bold !text-faint"
        }
      >
        {label}
      </Text>
      <Text
        as="span"
        className={
          wrap ? "!text-[inherit] !font-semibold !text-ink" : "!text-[inherit] !font-bold !text-ink"
        }
      >
        {value}
      </Text>
    </Box>
  );
}

function AccentSwatches({
  accent,
  onSelect,
}: {
  accent: string;
  onSelect: (accent: (typeof ACCENTS)[number]) => void;
}) {
  function renderSwatch(item: (typeof ACCENTS)[number]) {
    return (
      <AccentSwatch key={item.key} item={item} selected={accent === item.key} onSelect={onSelect} />
    );
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

const PRINT_CSS = `@media print {
  body * { visibility: hidden !important; }
  .idc-print-area, .idc-print-area * { visibility: visible !important; }
  .idc-print-area { position: fixed; inset: 0; padding: 14mm; background: #fff; }
  .idc-cards { gap: 10mm; }
}`;

function swatchClass(key: string, selected: boolean) {
  const fill = SWATCH_CLASS[key] ?? "";
  const ring = selected
    ? "!border-dark !shadow-[0_0_0_2px_#fff,0_0_0_4px_#1B3D29]"
    : "!border-transparent";
  return `!h-6 !w-6 !min-h-6 !rounded-[7px] !border-2 !p-0 !shadow-[0_1px_3px_rgba(0,0,0,.15)] ${fill} ${ring}`;
}

function AccentSwatch({
  item,
  selected,
  onSelect,
}: {
  item: (typeof ACCENTS)[number];
  selected: boolean;
  onSelect: (accent: (typeof ACCENTS)[number]) => void;
}) {
  function handleSelect() {
    onSelect(item);
  }
  return (
    <Button
      aria-label={item.key}
      title={item.key}
      data-accent={item.key}
      className={swatchClass(item.key, selected)}
      onClick={handleSelect}
    />
  );
}
