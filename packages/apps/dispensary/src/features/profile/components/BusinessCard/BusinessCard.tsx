import { Field } from "@/components/ui/Field";
import { Input } from "@/components/ui/Input";
import { Stack } from "@/components/ui/Stack";
import type { ProfileDocument, ProfileForm } from "../../model";
import { choiceOptions, IMAGE_ACCEPT, REGIONS } from "../../options";
import { CardTitle, ProfileSelect } from "../controls";
import { DocumentField } from "../DocumentField";
import { areaClass, cardClass, onValue } from "../formStyles";

type Patch = Partial<ProfileForm>;

export function BusinessCard({
  draft,
  phone,
  documents,
  onChange,
}: {
  draft: ProfileForm;
  phone: string;
  documents: ProfileDocument[];
  onChange: (patch: Patch) => void;
}) {
  const logo = documents.find((document) => document.slot === "logo");
  const logoFile = draft.files.logo instanceof File ? draft.files.logo : undefined;
  return (
    <Stack className={cardClass}>
      <CardTitle>Business</CardTitle>
      <Stack direction="row" align="start" gap={4}>
        <DocumentField
          label="Logo"
          layout="logo"
          accept={IMAGE_ACCEPT}
          file={logoFile}
          stored={Boolean(logo) && !draft.removeLogo}
          contentType={logo?.contentType}
          onFile={(file) => onChange({ removeLogo: false, files: { logo: file } })}
          onRemove={() => onChange({ removeLogo: true, files: { logo: undefined } })}
        />
        <Stack className="min-w-0 flex-1 gap-3">
          <Field label="Business Name *" htmlFor="profile-name">
            <Input
              id="profile-name"
              value={draft.name}
              maxLength={160}
              onChange={onValue((name) => onChange({ name }))}
            />
          </Field>
          <Field label="Tagline" htmlFor="profile-tagline">
            <Input
              id="profile-tagline"
              value={draft.tagline}
              maxLength={160}
              onChange={onValue((tagline) => onChange({ tagline }))}
            />
          </Field>
        </Stack>
      </Stack>
      <div className="grid grid-cols-1 gap-3.5 sm:grid-cols-6">
        <Field
          label="Company Phone Number"
          htmlFor="profile-phone"
          hint="Login uses this number, so it cannot be changed."
          className="sm:col-span-3"
        >
          <Input
            id="profile-phone"
            value={phone}
            readOnly
            aria-readonly="true"
            className="bg-wash-2"
          />
        </Field>
        <Field label="Company E-Mail" htmlFor="profile-email" className="sm:col-span-3">
          <Input
            id="profile-email"
            value={draft.email}
            maxLength={160}
            onChange={onValue((email) => onChange({ email }))}
          />
        </Field>
        <Field label="Billing Address" htmlFor="profile-address" className="sm:col-span-6">
          <textarea
            id="profile-address"
            value={draft.address}
            maxLength={300}
            onChange={onValue((address) => onChange({ address }))}
            className={areaClass}
          />
        </Field>
        <Field label="State" htmlFor="profile-state" className="sm:col-span-2">
          <ProfileSelect
            id="profile-state"
            value={draft.state}
            options={choiceOptions(REGIONS)}
            onChange={(state) => onChange({ state })}
          />
        </Field>
        <Field label="City" htmlFor="profile-city" className="sm:col-span-2">
          <Input
            id="profile-city"
            value={draft.city}
            maxLength={80}
            onChange={onValue((city) => onChange({ city }))}
          />
        </Field>
        <Field label="Pincode" htmlFor="profile-pincode" className="sm:col-span-2">
          <Input
            id="profile-pincode"
            value={draft.pincode}
            inputMode="numeric"
            maxLength={6}
            onChange={onValue((pincode) => onChange({ pincode }))}
          />
        </Field>
      </div>
    </Stack>
  );
}
