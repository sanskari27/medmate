import { useState } from "react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Stack } from "@/components/ui/Stack";
import { Text } from "@/components/ui/Text";
import type { ExtraDetail, ProfileForm } from "../../model";
import { CardTitle } from "../controls";
import { cardClass } from "../formStyles";

export function ExtraDetailsCard({
  details,
  onChange,
}: {
  details: ExtraDetail[];
  onChange: (patch: Partial<ProfileForm>) => void;
}) {
  const [label, setLabel] = useState("");
  const [value, setValue] = useState("");
  const ready = label.trim().length > 0 && value.trim().length > 0 && details.length < 20;
  function add() {
    if (!ready) return;
    onChange({ extraDetails: [...details, { label: label.trim(), value: value.trim() }] });
    setLabel("");
    setValue("");
  }
  return (
    <Stack className={cardClass}>
      <Stack className="gap-1">
        <CardTitle>Additional details</CardTitle>
        <Text variant="muted" className="text-[12.5px]">
          Additional info such as MSME number, Website, etc.
        </Text>
      </Stack>
      <div className="grid grid-cols-1 items-center gap-2 sm:grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)_auto]">
        <Input
          aria-label="Detail label"
          placeholder="Label (e.g. MSME)"
          value={label}
          maxLength={80}
          onChange={(event) => setLabel(event.target.value)}
        />
        <Text as="span" variant="muted" className="hidden sm:inline">
          =
        </Text>
        <Input
          aria-label="Detail value"
          placeholder="Value"
          value={value}
          maxLength={200}
          onChange={(event) => setValue(event.target.value)}
        />
        <Button type="button" disabled={!ready} onClick={add}>
          Add
        </Button>
      </div>
      {details.length > 0 ? (
        <Stack className="gap-2">
          {details.map((detail, index) => (
            <Stack
              key={`${detail.label}-${index}`}
              direction="row"
              align="center"
              justify="between"
              className="gap-2 rounded-sm border border-line bg-wash-2 px-3 py-2"
            >
              <Text as="span" className="min-w-0 text-[13px] font-bold">
                {detail.label} = {detail.value}
              </Text>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() =>
                  onChange({ extraDetails: details.filter((_, item) => item !== index) })
                }
              >
                Remove
              </Button>
            </Stack>
          ))}
        </Stack>
      ) : null}
    </Stack>
  );
}
