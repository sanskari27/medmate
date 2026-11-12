import { useEffect, useState, type ChangeEvent, type ReactNode } from "react";
import { Box } from "@/components/ui/Box";
import { Button } from "@/components/ui/Button";
import { Label } from "@/components/ui/Label";
import { Stack } from "@/components/ui/Stack";
import { Text } from "@/components/ui/Text";
import { useAuthState } from "@/features/authentication";
import { formatDayText, idCardValidThrough, type Employee, type Workplace } from "../../model";
import { code128Bars } from "../../barcode";

const ACCENTS = [
  { key: "Forest", className: "!bg-[linear-gradient(135deg,#1B3D29,#2F7D52)]" },
  { key: "Teal", className: "!bg-[linear-gradient(135deg,#0f3a3f,#1f7d8c)]" },
  { key: "Blue", className: "!bg-[linear-gradient(135deg,#16305e,#2563EB)]" },
  { key: "Violet", className: "!bg-[linear-gradient(135deg,#3a2d6e,#6d4fc4)]" },
  { key: "Slate", className: "!bg-[linear-gradient(135deg,#1f2937,#475569)]" },
  { key: "Gold", className: "!bg-[linear-gradient(135deg,#6a4a10,#c9922f)]" },
] as const;

const PRINT_CSS = `@media print {
  .print-area, .print-area * {
    -webkit-print-color-adjust: exact !important;
    print-color-adjust: exact !important;
  }
  .idc-card { break-inside: avoid; page-break-inside: avoid; }
}`;

export function EmployeeIdCard({
  employee,
  workplace,
  onClose,
}: {
  employee: Employee;
  workplace: Workplace;
  onClose: () => void;
}) {
  const [orient, setOrient] = useState<"landscape" | "portrait">("landscape");
  const [accent, setAccent] = useState<(typeof ACCENTS)[number]>(ACCENTS[0]);
  const [logo, setLogo] = useState<string | undefined>(workplace.logoUrl ?? undefined);
  const logoSrc = useAuthorizedImage(logo);
  const photoSrc = useAuthorizedImage(employee.photo?.url);
  const portrait = orient === "portrait";
  const initials = employee.name
    .split(" ")
    .map((word) => word[0] ?? "")
    .join("")
    .slice(0, 2)
    .toUpperCase();
  const cardClass = portrait
    ? "idc-card relative flex h-[340px] w-[214px] flex-col overflow-hidden rounded-[14px] border border-[#e1ece5] bg-white text-ink shadow-[0_8px_22px_rgba(27,61,41,.16)] print:h-[85.6mm] print:w-[53.98mm] print:border print:border-[#ccc] print:shadow-none"
    : "idc-card relative flex h-[214px] w-[340px] flex-col overflow-hidden rounded-[14px] border border-[#e1ece5] bg-white text-ink shadow-[0_8px_22px_rgba(27,61,41,.16)] print:h-[53.98mm] print:w-[85.6mm] print:border print:border-[#ccc] print:shadow-none";

  function chooseLogo(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === "string") setLogo(reader.result);
    };
    reader.readAsDataURL(file);
  }

  return (
    <Box
      className="fixed inset-0 z-[200] flex items-center justify-center overflow-auto bg-[rgba(15,30,22,.55)] p-5"
      onClick={onClose}
    >
      <style>{PRINT_CSS}</style>
      <Box
        role="dialog"
        aria-label={`Digital Employee ID — ${employee.name}`}
        className="max-h-[94vh] w-full max-w-[780px] overflow-auto rounded-2xl bg-[#f3f7f4] shadow-[0_24px_60px_rgba(0,0,0,.3)]"
        onClick={(event) => event.stopPropagation()}
      >
        <Stack
          direction="row"
          align="center"
          className="sticky top-0 z-[3] gap-2 border-b border-[#dce7e0] bg-[#f3f7f4] px-4 py-3.5"
        >
          <Text className="font-display text-sm font-extrabold text-dark">
            Digital Employee ID — {employee.name}
          </Text>
          <Box className="flex-1" />
          <Button type="button" className="!gap-[5px]" onClick={() => window.print()}>
            <PrintIcon /> Print / Save PDF
          </Button>
          <Button type="button" variant="ghost" className="!gap-[5px]" onClick={onClose}>
            <CloseIcon /> Close
          </Button>
        </Stack>
        <Stack
          direction="row"
          align="center"
          wrap
          className="gap-4 border-b border-[#dce7e0] bg-[#eef4f0] px-4 py-[11px]"
        >
          <Stack className="gap-1">
            <Label className="!text-[9.5px] !font-extrabold !tracking-[0.06em] !text-[#6a8a78] uppercase">
              Orientation
            </Label>
            <Stack
              direction="row"
              className="overflow-hidden rounded-sm border border-[#cfe0d6] bg-white"
            >
              <Button
                type="button"
                className={segmentClass(orient === "landscape")}
                onClick={() => setOrient("landscape")}
              >
                ▭ Horizontal
              </Button>
              <Button
                type="button"
                className={segmentClass(orient === "portrait")}
                onClick={() => setOrient("portrait")}
              >
                ▯ Vertical
              </Button>
            </Stack>
          </Stack>
          <Stack className="gap-1">
            <Label className="!text-[9.5px] !font-extrabold !tracking-[0.06em] !text-[#6a8a78] uppercase">
              Theme
            </Label>
            <Stack direction="row" className="gap-1.5">
              {ACCENTS.map((item) => (
                <Button
                  key={item.key}
                  type="button"
                  aria-label={item.key}
                  title={item.key}
                  className={`!h-6 !w-6 !min-w-6 !rounded-[7px] !border-2 !p-0 !shadow-[0_1px_3px_rgba(0,0,0,.15)] ${item.className} ${
                    accent.key === item.key
                      ? "!border-dark !shadow-[0_0_0_2px_#fff,0_0_0_4px_#1B3D29]"
                      : "!border-transparent"
                  }`}
                  onClick={() => setAccent(item)}
                />
              ))}
            </Stack>
          </Stack>
          <Stack className="gap-1">
            <Label className="!text-[9.5px] !font-extrabold !tracking-[0.06em] !text-[#6a8a78] uppercase">
              Logo
            </Label>
            <input
              id="employee-logo-input"
              type="file"
              accept="image/*"
              className="hidden"
              onChange={chooseLogo}
            />
            <Stack direction="row" className="gap-1.5">
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => document.getElementById("employee-logo-input")?.click()}
              >
                {logo ? "Change" : "Upload"}
              </Button>
              {logo && logo !== workplace.logoUrl ? (
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => setLogo(workplace.logoUrl ?? undefined)}
                >
                  Reset
                </Button>
              ) : null}
            </Stack>
          </Stack>
        </Stack>
        <Box className="print-area bg-transparent p-6 print:bg-white">
          <Box className="idc-cards flex flex-wrap justify-center gap-6 print:gap-[10mm]">
            <Box className={cardClass}>
              <Stack
                direction={portrait ? "column" : "row"}
                align="center"
                className={`${accent.className} gap-1.5 px-3 py-1.5 text-white ${portrait ? "text-center" : ""}`}
              >
                <LogoMark logo={logoSrc} />
                <Box className="min-w-0">
                  <Text
                    as="span"
                    className="block font-display text-sm leading-tight font-extrabold text-white"
                  >
                    {workplace.name}
                  </Text>
                  <Text
                    as="span"
                    className={`block text-white/85 ${portrait ? "text-[8px]" : "text-[9.5px]"}`}
                  >
                    {workplace.tagline || "Staff Identity Card"}
                  </Text>
                </Box>
              </Stack>
              <Text className="truncate bg-gold px-1 py-[3px] text-center text-[9px] font-extrabold tracking-[0.14em] text-deep">
                EMPLOYEE IDENTITY CARD
              </Text>
              <Stack
                direction={portrait ? "column" : "row"}
                align={portrait ? "center" : "start"}
                className={
                  portrait
                    ? "min-h-0 w-full flex-1 overflow-hidden gap-1 px-2.5 py-1 text-center"
                    : "min-h-0 flex-1 overflow-hidden gap-1.5 px-2.5 py-1"
                }
              >
                <Box
                  className={`relative grid shrink-0 place-items-center overflow-hidden rounded-sm border border-[#cfe0d6] bg-wash font-display text-[26px] font-extrabold text-mid ${portrait ? "h-[88px] w-[74px]" : "h-[76px] w-[64px]"}`}
                >
                  {photoSrc ? (
                    <img
                      src={photoSrc}
                      alt=""
                      className="absolute inset-0 h-full w-full object-cover"
                    />
                  ) : (
                    <Text as="span">{initials}</Text>
                  )}
                </Box>
                <Box className={portrait ? "w-full min-w-0 flex-1" : "min-w-0 flex-1"}>
                  <Text
                    as="span"
                    className={`!block font-display !text-sm !leading-none !font-extrabold !text-dark ${portrait ? "text-center" : ""}`}
                  >
                    {employee.name}
                  </Text>
                  <Text
                    as="span"
                    className={`!mt-0.5 !mb-1 !block !text-[10px] !leading-none !text-muted ${portrait ? "text-center" : ""}`}
                  >
                    {employee.position}
                    {employee.department ? ` · ${employee.department}` : ""}
                  </Text>
                  <Box className="grid grid-cols-2 gap-x-2 gap-y-0.5 text-left">
                    <Fact label="ID" value={employee.id} mono />
                    <Fact label="Phone" value={employee.phone || "—"} />
                    <Fact label="Blood" value={employee.bloodGroup || "—"} />
                    <Fact label="Type" value={employee.employment} />
                  </Box>
                </Box>
              </Stack>
              <Barcode code={employee.id} />
              <Stack
                direction="row"
                justify="between"
                className="mt-auto border-t border-[#e1ece5] bg-[#F0FAF4] px-3.5 py-[7px]"
              >
                <Text as="span" className="!text-[9px] !leading-none !text-muted">
                  Joined {formatDayText(employee.joinedOn || "")}
                </Text>
                <Text as="span" className="!text-[9px] !leading-none !text-muted">
                  Valid thru {idCardValidThrough(employee.joinedOn || "")}
                </Text>
              </Stack>
            </Box>
            <Box className={cardClass}>
              <Stack
                direction="row"
                align="center"
                className={`${accent.className} gap-1.5 px-3 py-1.5 text-white`}
              >
                <LogoMark logo={logoSrc} small />
                <Text
                  as="span"
                  className="block font-display text-sm leading-tight font-extrabold text-white"
                >
                  {workplace.name}
                </Text>
              </Stack>
              <Box className="flex min-h-0 flex-1 flex-col justify-between overflow-hidden px-3 py-1.5">
                <BackRow
                  compact={portrait}
                  label="Employee"
                  value={`${employee.name} · ${employee.id}`}
                />
                <BackRow compact={portrait} label="Department" value={employee.department || "—"} />
                <BackRow
                  compact={portrait}
                  label="Date of birth"
                  value={employee.dob ? formatDayText(employee.dob) : "—"}
                />
                <BackRow compact={portrait} label="Email" value={employee.email || "—"} />
                <BackRow compact={portrait} label="Home address" value={employee.address || "—"} />
                <BackRow
                  compact={portrait}
                  label="Emergency"
                  value={
                    employee.emergencyName
                      ? `${employee.emergencyName} · ${employee.emergencyPhone || ""}`
                      : "—"
                  }
                />
                <BackRow compact={portrait} label="Contact" value={workplace.phone || "—"} />
              </Box>
              <Box className="shrink-0 border-t border-[#e1ece5] bg-white px-3 py-1">
                <Box className="mb-0.5 flex flex-col items-end !text-[8px] !leading-none !text-muted">
                  <Box className="mb-0.5 block w-[110px] border-t border-faint" />
                  Authorised signatory
                </Box>
                <Text as="span" className="!block !text-[7.5px] !leading-snug !text-faint">
                  If found, please return to the issuer above. This card remains the property of{" "}
                  {workplace.name} and must be surrendered on cessation of employment.
                </Text>
              </Box>
            </Box>
          </Box>
        </Box>
      </Box>
    </Box>
  );
}

function useAuthorizedImage(source: string | undefined) {
  const { session } = useAuthState();
  const [resolved, setResolved] = useState<string | undefined>(
    source && !source.startsWith("/") ? source : undefined,
  );

  useEffect(() => {
    if (!source || !source.startsWith("/")) {
      setResolved(source);
      return;
    }
    const controller = new AbortController();
    let objectUrl: string | undefined;
    const token = session?.accessToken;
    fetch(source, {
      signal: controller.signal,
      headers: token ? { Authorization: `Bearer ${token}` } : {},
    })
      .then((response) => (response.ok ? response.blob() : null))
      .then((blob) => {
        if (!blob) {
          setResolved(undefined);
          return;
        }
        objectUrl = URL.createObjectURL(blob);
        setResolved(objectUrl);
      })
      .catch(() => {
        if (!controller.signal.aborted) setResolved(undefined);
      });
    return () => {
      controller.abort();
      if (objectUrl) URL.revokeObjectURL(objectUrl);
    };
  }, [source, session?.accessToken]);

  return resolved;
}

function segmentClass(selected: boolean) {
  return selected
    ? "!rounded-none !border-0 !bg-mid !px-[11px] !py-1.5 !text-[12.5px] !font-bold !text-white !shadow-none"
    : "!rounded-none !border-0 !bg-transparent !px-[11px] !py-1.5 !text-[12.5px] !font-bold !text-muted !shadow-none";
}

function Barcode({ code }: { code: string }) {
  const bars = code128Bars(code);
  const total = bars[0]?.total ?? 1;
  return (
    <Box className="bg-white px-2.5 py-0.5">
      <svg
        role="img"
        aria-label={`Barcode ${code}`}
        viewBox={`0 0 ${total} 50`}
        preserveAspectRatio="none"
        shapeRendering="crispEdges"
        className="block h-6 w-full"
      >
        <rect width={total} height="50" fill="#ffffff" />
        {bars.map((bar) => (
          <rect key={bar.x} x={bar.x} y="0" width={bar.width} height="42" fill="#000000" />
        ))}
      </svg>
    </Box>
  );
}

function LogoMark({ logo, small = false }: { logo?: string; small?: boolean }) {
  return (
    <Box
      className={
        small
          ? "relative grid h-[26px] w-[26px] shrink-0 place-items-center overflow-hidden rounded-sm bg-white text-mid"
          : "relative grid h-[34px] w-[34px] shrink-0 place-items-center overflow-hidden rounded-sm bg-white text-mid"
      }
    >
      {logo ? (
        <img src={logo} alt="" className="absolute inset-0 h-full w-full object-contain" />
      ) : (
        <Text as="span" className="text-mid">
          +
        </Text>
      )}
    </Box>
  );
}

function Fact({ label, value, mono = false }: { label: string; value: string; mono?: boolean }) {
  return (
    <Box>
      <Text
        as="span"
        className="!block !text-[7.5px] !leading-none !font-bold !tracking-[0.06em] !text-faint uppercase"
      >
        {label}
      </Text>
      <Text
        as="span"
        className={`!block !text-[11px] !leading-tight !font-bold !text-ink ${mono ? "!font-mono" : ""}`}
      >
        {value}
      </Text>
    </Box>
  );
}

function BackRow({ label, value, compact }: { label: string; value: string; compact: boolean }) {
  return (
    <Box className={`flex gap-2 ${compact ? "text-[9.5px] leading-[1.25]" : "text-[10.5px]"}`}>
      <Text
        as="span"
        className={`!shrink-0 !leading-none !font-bold !whitespace-nowrap !text-faint ${compact ? "!w-[62px] !text-[8.5px]" : "!w-[92px] !text-[9.5px]"}`}
      >
        {label}
      </Text>
      <Text
        as="span"
        className={`!min-w-0 !truncate !leading-none !font-bold !text-ink ${compact ? "!text-[9px]" : "!text-[10.5px]"}`}
      >
        {value}
      </Text>
    </Box>
  );
}

function PrintIcon() {
  return (
    <Svg>
      <path d="M6 9V3h12v6" />
      <path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2" />
      <path d="M6 14h12v7H6z" />
    </Svg>
  );
}

function CloseIcon() {
  return (
    <Svg>
      <path d="M6 6l12 12M18 6 6 18" />
    </Svg>
  );
}

function Svg({ children }: { children: ReactNode }) {
  return (
    <svg
      viewBox="0 0 24 24"
      width="14"
      height="14"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      {children}
    </svg>
  );
}
