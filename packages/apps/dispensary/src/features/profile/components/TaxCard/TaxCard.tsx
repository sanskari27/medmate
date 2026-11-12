import { Field } from "@/components/ui/Field";
import { Input } from "@/components/ui/Input";
import { Stack } from "@/components/ui/Stack";
import { Text } from "@/components/ui/Text";
import type { DocumentSlot, ProfileDocument, ProfileForm } from "../../model";
import { DOCUMENT_ACCEPT } from "../../options";
import { CardTitle, ToggleRow } from "../controls";
import { DocumentField } from "../DocumentField";
import { cardClass, onValue } from "../formStyles";

type Patch = Partial<ProfileForm>;

const LICENCES: {
  slot: DocumentSlot;
  number: "gstin" | "pan" | "drugLicenceNo" | "fssaiNo" | "tradeLicenceNo";
  numberLabel: string;
  fileLabel: string;
  maxLength: number;
}[] = [
  {
    slot: "gst",
    number: "gstin",
    numberLabel: "GSTIN *",
    fileLabel: "GST certificate",
    maxLength: 15,
  },
  { slot: "pan", number: "pan", numberLabel: "PAN Number", fileLabel: "PAN card", maxLength: 10 },
  {
    slot: "drug-licence",
    number: "drugLicenceNo",
    numberLabel: "Drug Licence No. (D.L.)",
    fileLabel: "Drug licence",
    maxLength: 40,
  },
  {
    slot: "fssai",
    number: "fssaiNo",
    numberLabel: "FSSAI Licence No.",
    fileLabel: "FSSAI licence",
    maxLength: 40,
  },
  {
    slot: "trade-licence",
    number: "tradeLicenceNo",
    numberLabel: "Trade Licence No.",
    fileLabel: "Trade licence",
    maxLength: 40,
  },
];

export function TaxCard({
  draft,
  documents,
  onChange,
}: {
  draft: ProfileForm;
  documents: ProfileDocument[];
  onChange: (patch: Patch) => void;
}) {
  const certificate = documents.find((document) => document.slot === "pharmacist-certificate");
  return (
    <Stack className={cardClass}>
      <CardTitle>Licences</CardTitle>
      <div className="overflow-hidden rounded-sm border border-line">
        <div className="hidden grid-cols-[210px_minmax(0,1fr)_200px] gap-3 border-b border-line bg-wash-2 px-3 py-2 md:grid">
          <Text as="span" variant="caption" className="font-bold tracking-[0.06em] uppercase">
            Licence
          </Text>
          <Text as="span" variant="caption" className="font-bold tracking-[0.06em] uppercase">
            Number
          </Text>
          <Text as="span" variant="caption" className="font-bold tracking-[0.06em] uppercase">
            File
          </Text>
        </div>
        {LICENCES.map((licence) => (
          <div
            key={licence.slot}
            className="grid grid-cols-1 items-center gap-2 border-b border-line px-3 py-2.5 last:border-b-0 md:grid-cols-[210px_minmax(0,1fr)_135px]"
          >
            <Text as="span" className="text-[13px] font-bold">
              {licence.numberLabel}
            </Text>
            <Input
              aria-label={licence.numberLabel}
              value={draft[licence.number]}
              maxLength={licence.maxLength}
              className="font-mono"
              onChange={onValue((value) =>
                onChange({
                  [licence.number]:
                    licence.slot === "gst" || licence.slot === "pan" ? value.toUpperCase() : value,
                }),
              )}
            />
            <DocumentField
              layout="inline"
              label={licence.fileLabel}
              accept={DOCUMENT_ACCEPT}
              file={fileOf(draft, licence.slot)}
              stored={Boolean(documents.some((document) => document.slot === licence.slot))}
              contentType={
                documents.find((document) => document.slot === licence.slot)?.contentType
              }
              onFile={(file) => onChange({ files: { [licence.slot]: file } })}
            />
          </div>
        ))}
      </div>
      <Stack direction="row" wrap className="gap-x-8 gap-y-3">
        <ToggleRow
          label="Enable e-Invoicing"
          badge="New"
          on={draft.eInvoicing}
          onToggle={() => onChange({ eInvoicing: !draft.eInvoicing })}
        />
        <ToggleRow
          label="Enable TDS"
          on={draft.enableTds}
          onToggle={() => onChange({ enableTds: !draft.enableTds })}
        />
        <ToggleRow
          label="Enable TCS"
          on={draft.enableTcs}
          onToggle={() => onChange({ enableTcs: !draft.enableTcs })}
        />
      </Stack>
      <div className="grid grid-cols-1 items-center gap-3 border-t border-line pt-4 md:grid-cols-[minmax(0,1fr)_135px]">
        <Field label="Registered pharmacist (on invoice)" htmlFor="profile-pharmacist">
          <Input
            id="profile-pharmacist"
            value={draft.pharmacistName}
            maxLength={160}
            onChange={onValue((pharmacistName) => onChange({ pharmacistName }))}
          />
        </Field>
        <Stack className="gap-1.5">
          <Text as="span" className="text-[11.5px] font-bold tracking-wide text-ink-2">
            Pharmacist certificate
          </Text>
          <DocumentField
            layout="inline"
            label="Pharmacist certificate"
            accept={DOCUMENT_ACCEPT}
            file={fileOf(draft, "pharmacist-certificate")}
            stored={Boolean(certificate)}
            contentType={certificate?.contentType}
            onFile={(file) => onChange({ files: { "pharmacist-certificate": file } })}
          />
        </Stack>
      </div>
    </Stack>
  );
}

function fileOf(draft: ProfileForm, slot: DocumentSlot) {
  const file = draft.files[slot];
  return file instanceof File ? file : undefined;
}
