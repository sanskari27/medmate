import { Box } from "@/components/ui/Box";
import { Field } from "@/components/ui/Field";
import { Stack } from "@/components/ui/Stack";
import { Text } from "@/components/ui/Text";
import type { ProfileDocument, ProfileForm } from "../../model";
import { IMAGE_ACCEPT } from "../../options";
import { CardTitle } from "../controls";
import { DocumentField } from "../DocumentField";
import { areaClass, cardClass, onValue } from "../formStyles";

export function InvoiceCard({
  draft,
  documents,
  onChange,
}: {
  draft: ProfileForm;
  documents: ProfileDocument[];
  onChange: (patch: Partial<ProfileForm>) => void;
}) {
  const signature = documents.find((document) => document.slot === "signature");
  const file = draft.files.signature instanceof File ? draft.files.signature : undefined;
  return (
    <Stack className={cardClass}>
      <CardTitle>Invoice</CardTitle>
      <Box className="rounded-md border border-line bg-wash-2 px-3 py-2.5">
        <Text as="span" className="text-[12.5px]">
          <Text as="span" className="font-bold">
            Note:
          </Text>{" "}
          Terms & Conditions and Signature below are shown on your invoices.
        </Text>
      </Box>
      <Field label="Terms & Conditions" htmlFor="profile-terms">
        <textarea
          id="profile-terms"
          value={draft.terms}
          maxLength={4000}
          onChange={onValue((terms) => onChange({ terms }))}
          className={`${areaClass} min-h-28 flex-1`}
        />
      </Field>
      <DocumentField
        label="Signature"
        accept={IMAGE_ACCEPT}
        file={file}
        stored={Boolean(signature)}
        contentType={signature?.contentType}
        onFile={(next) => onChange({ files: { signature: next } })}
      />
    </Stack>
  );
}
