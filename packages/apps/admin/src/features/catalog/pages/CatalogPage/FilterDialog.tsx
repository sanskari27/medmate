import { useId } from "react";
import { Button } from "@/components/ui/Button";
import { Field } from "@/components/ui/Field";
import { Input } from "@/components/ui/Input";
import { Stack } from "@/components/ui/Stack";
import { Text } from "@/components/ui/Text";
import { useDialogClose } from "../../dialog";
import { ModalDialog } from "../../modal";
import type { CatalogFilters } from "../../model";

const selectClass =
  "w-full rounded-sm border border-line-2 bg-paper px-3 py-[9px] text-[13.5px] text-ink outline-none hover:border-[#b9d0c2] focus:border-mid focus:shadow-focus";

function FilterFields({
  filters,
  onChoose,
  onClear,
}: {
  filters: CatalogFilters;
  onChoose: <Key extends keyof CatalogFilters>(key: Key, value: CatalogFilters[Key]) => void;
  onClear: () => void;
}) {
  const close = useDialogClose();
  const busy =
    filters.displayName !== "" ||
    filters.prescription !== "" ||
    filters.form !== "" ||
    filters.medicineType !== "" ||
    filters.fmcgType !== "" ||
    filters.marketer !== "";

  return (
    <>
      <Text variant="muted">Narrow by label, type, or marketer. Search stays on the page.</Text>
      <div className="grid gap-3 sm:grid-cols-2">
        <Field label="Display name" htmlFor="catalog-display-name">
          <select
            id="catalog-display-name"
            data-slot="select"
            className={selectClass}
            value={filters.displayName}
            onChange={(event) =>
              onChoose("displayName", event.target.value as CatalogFilters["displayName"])
            }
          >
            <option value="">Either</option>
            <option value="missing">Missing</option>
            <option value="present">Present</option>
          </select>
        </Field>
        <Field label="Prescription" htmlFor="catalog-prescription">
          <select
            id="catalog-prescription"
            data-slot="select"
            className={selectClass}
            value={filters.prescription}
            onChange={(event) =>
              onChoose("prescription", event.target.value as CatalogFilters["prescription"])
            }
          >
            <option value="">Any</option>
            <option value="yes">Yes</option>
            <option value="no">No</option>
          </select>
        </Field>
        <Field label="Form" htmlFor="catalog-form">
          <Input
            id="catalog-form"
            value={filters.form}
            onChange={(event) => onChoose("form", event.target.value)}
          />
        </Field>
        <Field label="Medicine type" htmlFor="catalog-medicine-type">
          <Input
            id="catalog-medicine-type"
            value={filters.medicineType}
            onChange={(event) => onChoose("medicineType", event.target.value)}
          />
        </Field>
        <Field label="FMCG type" htmlFor="catalog-fmcg-type">
          <Input
            id="catalog-fmcg-type"
            value={filters.fmcgType}
            onChange={(event) => onChoose("fmcgType", event.target.value)}
          />
        </Field>
        <Field label="Marketer" htmlFor="catalog-marketer">
          <Input
            id="catalog-marketer"
            value={filters.marketer}
            onChange={(event) => onChoose("marketer", event.target.value)}
          />
        </Field>
      </div>
      <Stack direction="row" justify="end" className="gap-2">
        <Button type="button" variant="ghost" disabled={!busy} onClick={onClear}>
          Clear filters
        </Button>
        <Button type="button" onClick={close}>
          Done
        </Button>
      </Stack>
    </>
  );
}

export function FilterDialog({
  filters,
  onChoose,
  onClear,
  onClose,
}: {
  filters: CatalogFilters;
  onChoose: <Key extends keyof CatalogFilters>(key: Key, value: CatalogFilters[Key]) => void;
  onClear: () => void;
  onClose: () => void;
}) {
  const titleId = useId();
  return (
    <ModalDialog title="Filters" titleId={titleId} width="wide" onClose={onClose}>
      <FilterFields filters={filters} onChoose={onChoose} onClear={onClear} />
    </ModalDialog>
  );
}
