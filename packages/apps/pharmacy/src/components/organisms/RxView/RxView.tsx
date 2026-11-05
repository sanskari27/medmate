import { useState } from "react";
import { Box } from "@/components/atoms/Box";
import { Button } from "@/components/atoms/Button";
import { Heading } from "@/components/atoms/Heading";
import { IconButton } from "@/components/atoms/IconButton";
import { Image } from "@/components/atoms/Image";
import { Stack } from "@/components/atoms/Stack";
import { Text } from "@/components/atoms/Text";
import { IconCheck, IconDoc, IconDownload, IconPill, IconX } from "@/components/atoms/Icon";
import { Pill } from "@/components/atoms/Pill";
import { fmtDateTime, rxImageDataUrl, type Prescription, type RxMed } from "@/utils";
import { buildRxPdf } from "@/utils/pdf";
import { cn } from "@/utils/className";
import type { RxViewProps } from "./RxView.types";

function openPdf(rx: Prescription) {
  const url = URL.createObjectURL(buildRxPdf(rx));
  window.open(url, "_blank");
  setTimeout(function revoke() {
    URL.revokeObjectURL(url);
  }, 60000);
}

function stopZoomClose(event: { stopPropagation: () => void }) {
  event.stopPropagation();
}

function RxMedRow({ med }: { med: RxMed }) {
  return (
    <Stack direction="row" justify="between" gap={3} className="border-b border-dashed border-line py-1.5">
      <Text as="span" className="font-bold">
        {med.name}
      </Text>
      <Text as="span" variant="caption" className="whitespace-nowrap">
        {med.dose}
        {med.days ? ` · ${med.days}d` : ""}
      </Text>
    </Stack>
  );
}

function RxMeds({ meds }: { meds: RxMed[] }) {
  return meds.map(function renderMed(med, index) {
    return <RxMedRow key={med.name + index} med={med} />;
  });
}

function DigitalRx({ rx, className }: { rx: Prescription; className?: string }) {
  const signed = rx.signedAt ?? rx.uploadedAt;
  function onDownload() {
    openPdf(rx);
  }
  return (
    <Box data-slot="rx-view" className={cn("overflow-hidden rounded-lg border border-line bg-wash", className)}>
      <Stack direction="row" align="center" gap={2} className="bg-dark px-3.5 py-2.5 text-white">
        <IconPill size={16} />
        <Heading level={4} className="flex-1 text-[13.5px] text-white">
          Namma MedMate · Digital Prescription
        </Heading>
        <Pill className="bg-white/20 text-white">
          <IconCheck size={12} /> Verified
        </Pill>
      </Stack>
      <Stack gap={2} className="bg-paper p-3.5">
        <Heading level={4}>{rx.doctor}</Heading>
        <Text variant="caption">
          Reg. {rx.regNo ?? "—"} · Patient: {rx.patient}
        </Text>
        <Text as="span" className="mt-1 text-[11px] font-extrabold tracking-wide text-mid uppercase">
          ℞ Medicines
        </Text>
        <RxMeds meds={rx.meds ?? []} />
        {rx.note ? (
          <Text variant="caption">
            <IconDoc size={13} /> {rx.note}
          </Text>
        ) : null}
        <Stack direction="row" align="center" justify="between" gap={2} className="mt-2">
          <Text variant="caption">
            <Text as="span" className="font-display text-[18px] text-mid italic">
              {rx.doctor.replace(/^Dr\.?\s*/i, "")}
            </Text>{" "}
            · e-signed {fmtDateTime(signed)}
          </Text>
          <Button size="sm" className="rounded-full" onClick={onDownload}>
            <IconDownload size={13} /> PDF
          </Button>
        </Stack>
      </Stack>
    </Box>
  );
}

function PdfRx({ rx, className }: { rx: Prescription; className?: string }) {
  function onOpen() {
    openPdf(rx);
  }
  return (
    <Box data-slot="rx-view" className={cn("overflow-hidden rounded-lg border border-line bg-paper", className)}>
      <Stack direction="row" align="center" gap={2} className="bg-wash-2 px-3.5 py-2.5">
        <IconDoc size={15} />
        <Heading level={4} className="flex-1 text-[13.5px]">
          Patient-uploaded prescription · PDF
        </Heading>
      </Stack>
      <Button
        variant="ghost"
        className="h-auto w-full justify-start gap-3 whitespace-normal bg-rose-bg px-4 py-4 text-left hover:bg-rose-bg"
        onClick={onOpen}
      >
        <Box className="grid h-12 w-11 shrink-0 place-items-center rounded-sm bg-rose text-[12px] font-extrabold text-white">
          PDF
        </Box>
        <Stack gap={0} className="min-w-0 flex-1">
          <Text as="span" className="text-[13.5px] font-bold">
            {rx.id}.pdf
          </Text>
          <Text variant="caption">{rx.doctor} · tap to open</Text>
        </Stack>
        <Text as="span" className="rounded-full bg-dark px-2.5 py-1.5 text-[11.5px] font-extrabold text-white">
          Open PDF
        </Text>
      </Button>
      <Text variant="caption" className="px-3.5 py-2.5">
        Patient: {rx.patient} · uploaded {fmtDateTime(rx.uploadedAt)}
      </Text>
    </Box>
  );
}

function ImageRx({ rx, compact, className }: { rx: Prescription; compact?: boolean; className?: string }) {
  const [zoom, setZoom] = useState(false);
  const src = rx.image || rxImageDataUrl(rx);
  function onDownload() {
    openPdf(rx);
  }
  function openZoom() {
    setZoom(true);
  }
  function closeZoom() {
    setZoom(false);
  }
  return (
    <>
      <Box data-slot="rx-view" className={cn("overflow-hidden rounded-lg border border-line bg-paper", className)}>
        <Stack direction="row" align="center" gap={2} className="bg-wash-2 px-3.5 py-2.5">
          <IconDoc size={15} />
          <Heading level={4} className="flex-1 text-[13.5px]">
            Patient-uploaded prescription
          </Heading>
          <Button variant="link" className="text-[11.5px] font-extrabold" onClick={onDownload}>
            <IconDownload size={13} /> PDF
          </Button>
          <Button variant="link" className="text-[11.5px] font-extrabold" onClick={openZoom}>
            Enlarge ⤢
          </Button>
        </Stack>
        <Button variant="ghost" className="h-auto w-full rounded-none bg-canvas px-3 py-3" onClick={openZoom}>
          <Image
            src={src}
            alt={`Prescription ${rx.id}`}
            fit="contain"
            rounded="sm"
            className={cn("w-full", compact ? "max-h-[200px]" : "max-h-[320px]")}
          />
        </Button>
        <Text variant="caption" className="px-3.5 py-2.5">
          {rx.doctor} · Patient: {rx.patient} · uploaded {fmtDateTime(rx.uploadedAt)}
        </Text>
      </Box>
      {zoom ? (
        <Box
          className="fixed inset-0 z-[80] flex items-center justify-center bg-deep/80 p-5"
          onClick={closeZoom}
        >
          <Image
            src={src}
            alt={`Prescription ${rx.id}`}
            fit="contain"
            rounded="sm"
            className="max-h-full max-w-full rounded-md shadow-pop"
            onClick={stopZoomClose}
          />
          <IconButton label="Close" className="fixed top-4 right-4 rounded-full bg-paper" onClick={closeZoom}>
            <IconX size={16} />
          </IconButton>
        </Box>
      ) : null}
    </>
  );
}

export default function RxView({ rx, compact, className }: RxViewProps) {
  if (rx.kind === "digital") return <DigitalRx rx={rx} className={className} />;
  if (rx.fileType === "pdf") return <PdfRx rx={rx} className={className} />;
  return <ImageRx rx={rx} compact={compact} className={className} />;
}

export type { RxViewProps };
