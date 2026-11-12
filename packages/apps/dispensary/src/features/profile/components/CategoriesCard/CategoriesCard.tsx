import { Button } from "@/components/ui/Button";
import { Field } from "@/components/ui/Field";
import { Stack } from "@/components/ui/Stack";
import { cn } from "@/utils/className";
import type { ProfileForm } from "../../model";
import {
  BUSINESS_TYPES,
  choiceOptions,
  INDUSTRIES,
  PHARMACY_TYPE_OPTIONS,
  REGISTRATION_TYPES,
} from "../../options";
import { CardTitle, ProfileSelect } from "../controls";
import { cardClass } from "../formStyles";

export function CategoriesCard({
  draft,
  onChange,
}: {
  draft: ProfileForm;
  onChange: (patch: Partial<ProfileForm>) => void;
}) {
  const typeOptions = PHARMACY_TYPE_OPTIONS.some((option) => option.value === draft.pharmacyType)
    ? PHARMACY_TYPE_OPTIONS
    : [...PHARMACY_TYPE_OPTIONS, { value: draft.pharmacyType, label: draft.pharmacyType }];
  function toggleType(type: string) {
    const businessTypes = draft.businessTypes.includes(type)
      ? draft.businessTypes.filter((item) => item !== type)
      : [...draft.businessTypes, type];
    onChange({ businessTypes });
  }
  return (
    <Stack className={cardClass}>
      <CardTitle>Classification</CardTitle>
      <div className="grid grid-cols-1 gap-3.5 md:grid-cols-3">
        <Field
          label="Pharmacy type"
          htmlFor="profile-pharmacy-type"
          hint="Set during setup, so it cannot be changed."
        >
          <ProfileSelect
            id="profile-pharmacy-type"
            value={draft.pharmacyType}
            options={typeOptions}
            disabled
            onChange={() => undefined}
          />
        </Field>
        <Field label="Industry Type" htmlFor="profile-industry">
          <ProfileSelect
            id="profile-industry"
            value={draft.industry}
            options={choiceOptions(INDUSTRIES)}
            onChange={(industry) => onChange({ industry })}
          />
        </Field>
        <Field label="Business Registration Type" htmlFor="profile-registration">
          <ProfileSelect
            id="profile-registration"
            value={draft.registrationType}
            options={choiceOptions(REGISTRATION_TYPES)}
            onChange={(registrationType) => onChange({ registrationType })}
          />
        </Field>
      </div>
      <Field label="Store categories (select multiple, if applicable)">
        <Stack direction="row" wrap className="gap-1.5">
          {BUSINESS_TYPES.map((type) => {
            const on = draft.businessTypes.includes(type);
            return (
              <Button
                key={type}
                type="button"
                variant="ghost"
                size="sm"
                aria-pressed={on}
                onClick={() => toggleType(type)}
                className={cn(on && "border-mid bg-mid text-white hover:bg-green hover:text-white")}
              >
                {type}
              </Button>
            );
          })}
        </Stack>
      </Field>
    </Stack>
  );
}
