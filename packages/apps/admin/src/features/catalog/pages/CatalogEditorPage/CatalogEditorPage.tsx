import { useId, useMemo, useState, type FormEvent } from "react";
import { Link, useParams } from "react-router-dom";
import { Button } from "@/components/ui/Button";
import { Field } from "@/components/ui/Field";
import { Heading } from "@/components/ui/Heading";
import { Input } from "@/components/ui/Input";
import { Stack } from "@/components/ui/Stack";
import { Text } from "@/components/ui/Text";
import { cn } from "@/utils/className";
import { useReadProductQuery, useSaveProductMutation } from "../../catalog.api";
import {
  childLists,
  draftFrom,
  emptyDraft,
  parentFields,
  productBody,
  type CatalogKind,
  type CatalogProduct,
  type ChildList,
  type Draft,
  type ParentField,
} from "../../model";
import { problemMessage } from "../../problemMessage";
import { CategoryBoard } from "./CategoryBoard";
import { DetailsDialog } from "./DetailsDialog";
import { entryName } from "./entryName";
import { RowDialog } from "./RowDialog";

const areaClass =
  "w-full rounded-sm border border-line-2 bg-paper px-3 py-[9px] text-[13.5px] text-ink outline-none hover:border-[#b9d0c2] focus:border-mid focus:shadow-focus";

const cardClass = "rounded-xl border border-line bg-paper shadow-sm";

const identityKeys = new Set([
  "productId",
  "displayName",
  "productName",
  "marketerName",
  "marketingCompany",
  "medicineType",
  "type",
  "productForm",
  "package",
  "mrp",
]);

function blankRow(list: Extract<ChildList, { shape: "object" }>): Record<string, string> {
  const row: Record<string, string> = {};
  for (const column of list.columns) row[column.key] = "";
  return row;
}

type RowTarget = { key: string; index: number | null };

export function CatalogEditorPage({ kind }: { kind: CatalogKind }) {
  const { productId } = useParams();
  const creating = productId === undefined;
  const formName = useId();
  const formId = useId();
  const detail = useReadProductQuery(productId ?? "", { skip: creating });
  const [save, pending] = useSaveProductMutation();
  const [edited, setEdited] = useState<Draft | null>(null);
  const [failure, setFailure] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);
  const [rowTarget, setRowTarget] = useState<RowTarget | null>(null);
  const [detailsOpen, setDetailsOpen] = useState(false);
  const blank = useMemo(() => emptyDraft(kind), [kind]);
  const loaded = productFor(kind, detail.data);
  const draft = edited ?? (creating ? blank : loaded ? draftFrom(kind, loaded) : null);

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!draft) return;
    setSaved(false);
    const parsed = productBody(kind, draft);
    if (!parsed.body) {
      setFailure(parsed.error ?? "Product is not valid");
      const idReady = (draft.fields.productId ?? "").trim().length > 0;
      const nameReady = (draft.fields.productName ?? "").trim().length > 0;
      if (idReady && nameReady) setDetailsOpen(true);
      return;
    }
    setFailure(null);
    try {
      await save({
        kind,
        productId: creating ? undefined : productId,
        body: parsed.body,
      }).unwrap();
      setSaved(true);
    } catch (error) {
      setFailure(problemMessage(error, "Could not save this product"));
    }
  }

  if (!creating && detail.isLoading) {
    return <Text className="text-[13.5px] text-muted">Loading product</Text>;
  }
  if (!creating && (detail.isError || !loaded || !draft)) {
    return (
      <Stack className="gap-3">
        <Button variant="link" asChild className="w-fit text-[13px]">
          <Link to="/catalog">Manage Catalog</Link>
        </Button>
        <Text className="text-[13.5px] font-bold text-rose" role="alert">
          {problemMessage(detail.error, "Product was not found")}
        </Text>
      </Stack>
    );
  }
  if (!draft) return null;
  const form = draft;

  function update(next: Draft) {
    setEdited(next);
    setSaved(false);
  }

  const activeList = rowTarget ? childLists(kind).find((list) => list.key === rowTarget.key) : null;
  const fields = parentFields(kind);
  const identity = fields.filter((field) => identityKeys.has(field.key));
  const details = fields.filter((field) => !identityKeys.has(field.key));
  const filledDetails = details.filter((field) => (form.fields[field.key] ?? "").trim() !== "");

  function control(field: ParentField) {
    return (
      <ParentControl
        key={field.key}
        field={field}
        formName={formName}
        readOnly={field.key === "productId" && !creating}
        value={form.fields[field.key] ?? ""}
        invalid={
          failure === "Product is not valid" &&
          field.required === true &&
          !(form.fields[field.key] ?? "").trim()
        }
        onChange={(value) => update({ ...form, fields: { ...form.fields, [field.key]: value } })}
      />
    );
  }

  function saveRow(values: Record<string, string>) {
    if (!draft || !activeList || !rowTarget) return;
    if (activeList.shape === "text") {
      const rows = [...(draft.texts[activeList.key] ?? [])];
      const value = values.value ?? "";
      if (rowTarget.index === null) rows.push(value);
      else rows[rowTarget.index] = value;
      update({ ...draft, texts: { ...draft.texts, [activeList.key]: rows } });
    } else {
      const rows = [...(draft.objects[activeList.key] ?? [])];
      if (rowTarget.index === null) rows.push(values);
      else rows[rowTarget.index] = values;
      update({ ...draft, objects: { ...draft.objects, [activeList.key]: rows } });
    }
    setRowTarget(null);
  }

  return (
    <Stack className="gap-4">
      <Button variant="link" asChild className="w-fit text-[13px]">
        <Link to="/catalog">Manage Catalog</Link>
      </Button>
      <Stack direction="row" align="end" justify="between" wrap className="gap-3">
        <Stack className="gap-1">
          <Text variant="label" className="uppercase">
            {kind === "drug" ? "Drug" : "FMCG"}
          </Text>
          <Heading id={formName} level={2}>
            {creating
              ? kind === "drug"
                ? "New drug"
                : "New FMCG"
              : draft.fields.productName || productId}
          </Heading>
        </Stack>
        <Button type="submit" form={formId} disabled={pending.isLoading} className="shrink-0">
          {creating ? "Create product" : "Save product"}
        </Button>
      </Stack>
      {failure ? (
        <Text className="text-[13.5px] font-bold text-rose" role="alert" aria-live="polite">
          {failure}
        </Text>
      ) : null}
      {saved ? (
        <Text className="text-[13.5px] font-bold text-dark" role="status">
          Saved.
        </Text>
      ) : null}
      <form id={formId} aria-labelledby={formName} className="grid gap-4" onSubmit={onSubmit}>
        <div className="grid items-start gap-4 xl:grid-cols-[minmax(0,1.6fr)_minmax(260px,0.7fr)]">
          <section className={cn(cardClass, "grid gap-4 p-4 sm:p-5")}>
            <Heading level={3}>Product</Heading>
            <div className="grid gap-3 sm:grid-cols-2">
              {identity.map((field) => control(field))}
            </div>
            {kind === "drug" ? (
              <fieldset className="grid gap-2 border-t border-line pt-4">
                <legend className="text-[13px] font-bold text-dark">Prescription required</legend>
                <div className="inline-flex w-fit rounded-sm border border-line-2 bg-canvas p-0.5">
                  <PrescriptionChoice
                    formName={formName}
                    checked={draft.prescriptionRequired}
                    label="Yes"
                    onChange={() => update({ ...draft, prescriptionRequired: true })}
                  />
                  <PrescriptionChoice
                    formName={formName}
                    checked={!draft.prescriptionRequired}
                    label="No"
                    onChange={() => update({ ...draft, prescriptionRequired: false })}
                  />
                </div>
              </fieldset>
            ) : null}
          </section>
          <article
            className={cn(cardClass, "flex h-full flex-col justify-between gap-4 p-4 sm:p-5")}
          >
            <Stack className="gap-1.5">
              <Text variant="label" className="uppercase">
                Label
              </Text>
              <Heading level={3}>Product details</Heading>
              <Text variant="muted">Quantity, storage, origin, and the longer descriptions.</Text>
            </Stack>
            <Stack className="gap-3">
              <Text className="text-[13.5px] font-bold text-dark">
                {filledDetails.length === 0
                  ? "Nothing filled yet"
                  : `${filledDetails.length} of ${details.length} filled`}
              </Text>
              {filledDetails.length > 0 ? (
                <ul className="flex flex-wrap gap-1.5">
                  {filledDetails.slice(0, 4).map((field) => (
                    <li
                      key={field.key}
                      className="rounded-full bg-wash px-2 py-0.5 text-[11px] font-bold text-dark"
                    >
                      {field.label}
                    </li>
                  ))}
                </ul>
              ) : null}
              <Button type="button" variant="line" onClick={() => setDetailsOpen(true)}>
                Edit details
              </Button>
            </Stack>
          </article>
        </div>
        <div className="grid items-start gap-4 lg:grid-cols-2 xl:grid-cols-3">
          {childLists(kind).map((list) => (
            <div
              key={list.key}
              className={list.key === "categories" ? "lg:col-span-2 xl:col-span-3" : undefined}
            >
              <ChildEditor
                list={list}
                draft={draft}
                onChange={update}
                onEdit={(index) => setRowTarget({ key: list.key, index })}
              />
            </div>
          ))}
        </div>
      </form>
      {detailsOpen ? (
        <DetailsDialog onClose={() => setDetailsOpen(false)}>
          {details.map((field) => control(field))}
        </DetailsDialog>
      ) : null}
      {activeList && rowTarget ? (
        <RowDialog
          title={`${rowTarget.index === null ? "Add" : "Edit"} ${entryName(activeList.label)}`}
          list={activeList}
          mode={rowTarget.index === null ? "add" : "edit"}
          initial={initialValues(activeList, draft, rowTarget.index)}
          onClose={() => setRowTarget(null)}
          onSave={saveRow}
        />
      ) : null}
    </Stack>
  );
}

function initialValues(
  list: ChildList,
  draft: Draft,
  index: number | null,
): Record<string, string> {
  if (list.shape === "text") {
    const current = index === null ? "" : (draft.texts[list.key]?.[index] ?? "");
    return { value: current };
  }
  if (index === null) return blankRow(list);
  return { ...blankRow(list), ...(draft.objects[list.key]?.[index] ?? {}) };
}

function productFor(
  kind: CatalogKind,
  data: { drug: CatalogProduct[]; fmcg: CatalogProduct[] } | undefined,
): CatalogProduct | null {
  if (!data) return null;
  const rows = kind === "drug" ? data.drug : data.fmcg;
  return rows[0] ?? null;
}

function ParentControl({
  field,
  formName,
  value,
  readOnly,
  invalid,
  onChange,
}: {
  field: ParentField;
  formName: string;
  value: string;
  readOnly: boolean;
  invalid: boolean;
  onChange: (value: string) => void;
}) {
  const id = `${formName}-${field.key}`;
  const label = field.required ? `${field.label} *` : field.label;
  return (
    <Field label={label} htmlFor={id} className={field.multiline ? "sm:col-span-2" : undefined}>
      {field.multiline ? (
        <textarea
          id={id}
          name={field.key}
          className={areaClass}
          rows={3}
          value={value}
          required={field.required}
          aria-invalid={invalid || undefined}
          onChange={(event) => onChange(event.target.value)}
        />
      ) : (
        <Input
          id={id}
          name={field.key}
          value={value}
          required={field.required}
          readOnly={readOnly}
          aria-invalid={invalid || undefined}
          inputMode={field.numeric ? "decimal" : undefined}
          autoCorrect={field.key === "productId" ? "off" : undefined}
          autoCapitalize={field.key === "productId" ? "none" : undefined}
          spellCheck={field.key === "productId" ? false : undefined}
          className={readOnly ? "bg-canvas text-muted" : undefined}
          onChange={(event) => onChange(event.target.value)}
        />
      )}
    </Field>
  );
}

function PrescriptionChoice({
  formName,
  checked,
  label,
  onChange,
}: {
  formName: string;
  checked: boolean;
  label: string;
  onChange: () => void;
}) {
  return (
    <label
      className={cn(
        "cursor-pointer rounded-xs px-3 py-1.5 text-[13px] font-bold",
        checked ? "bg-mid text-white" : "text-ink-2",
      )}
    >
      <input
        className="sr-only"
        type="radio"
        name={`${formName}-prescription`}
        checked={checked}
        onChange={onChange}
      />
      {label}
    </label>
  );
}

function ChildEditor({
  list,
  draft,
  onChange,
  onEdit,
}: {
  list: ChildList;
  draft: Draft;
  onChange: (draft: Draft) => void;
  onEdit: (index: number | null) => void;
}) {
  const textRows = list.shape === "text" ? (draft.texts[list.key] ?? []) : [];
  const objectRows = list.shape === "object" ? (draft.objects[list.key] ?? []) : [];
  const count = list.shape === "text" ? textRows.length : objectRows.length;
  const titles =
    list.shape === "text"
      ? textRows.map((value) => value.trim() || "Empty")
      : objectRows.map((row) => objectTitle(list, row));

  function remove(index: number) {
    if (list.shape === "text") {
      onChange({
        ...draft,
        texts: { ...draft.texts, [list.key]: textRows.filter((_, row) => row !== index) },
      });
      return;
    }
    onChange({
      ...draft,
      objects: {
        ...draft.objects,
        [list.key]: objectRows.filter((_, row) => row !== index),
      },
    });
  }

  if (list.key === "categories" && list.shape === "text") {
    return (
      <CategoryBoard
        names={textRows}
        onChange={(names) => onChange({ ...draft, texts: { ...draft.texts, [list.key]: names } })}
      />
    );
  }

  return (
    <section className={cn(cardClass, "overflow-hidden")}>
      <Stack
        direction="row"
        align="center"
        justify="between"
        className="gap-3 border-b border-line bg-wash-2 px-4 py-3"
      >
        <Stack direction="row" align="center" className="min-w-0 gap-2">
          <Heading level={3}>{list.label}</Heading>
          <Text
            as="span"
            className="rounded-full bg-wash px-2 py-0.5 text-[11px] font-bold text-dark"
          >
            {count}
          </Text>
        </Stack>
        <Button
          type="button"
          size="sm"
          className="shrink-0"
          aria-label={`Add ${entryName(list.label)}`}
          onClick={() => onEdit(null)}
        >
          Add
        </Button>
      </Stack>
      {count === 0 ? (
        <Text className="px-4 py-6 text-center text-[13.5px] text-muted">
          {`No ${list.label.toLowerCase()} yet.`}
        </Text>
      ) : (
        <ul className="grid max-h-80 gap-2 overflow-y-auto p-3">
          {titles.map((title, index) => {
            const meta =
              list.shape === "object" ? objectMeta(list, objectRows[index] ?? {}, title) : "";
            const editName = actionName("Edit", title, index, titles);
            const removeName = actionName("Remove", title, index, titles);
            return (
              <li
                key={`${list.key}-${index}`}
                className="flex items-center gap-3 rounded-lg border border-line bg-canvas px-3 py-2.5"
              >
                <span className="min-w-0 flex-1">
                  <Text className="truncate text-[14px] font-bold text-dark">{title}</Text>
                  {meta ? (
                    <Text variant="muted" className="truncate">
                      {meta}
                    </Text>
                  ) : null}
                </span>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="shrink-0"
                  aria-label={editName}
                  onClick={() => onEdit(index)}
                >
                  Edit
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="shrink-0"
                  aria-label={removeName}
                  onClick={() => remove(index)}
                >
                  Remove
                </Button>
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}

function objectTitle(list: Extract<ChildList, { shape: "object" }>, row: Record<string, string>) {
  const required = list.columns.find((column) => column.required);
  const primary = required ? (row[required.key] ?? "").trim() : "";
  if (primary) return primary;
  for (const column of list.columns) {
    const value = (row[column.key] ?? "").trim();
    if (value) return value;
  }
  return "Empty";
}

function objectMeta(
  list: Extract<ChildList, { shape: "object" }>,
  row: Record<string, string>,
  title: string,
) {
  return list.columns
    .map((column) => (row[column.key] ?? "").trim())
    .filter((value) => value && value !== title)
    .join(" · ");
}

function actionName(action: string, title: string, index: number, titles: string[]) {
  const duplicated = titles.filter((item) => item === title).length > 1;
  return duplicated ? `${action} ${title} ${index + 1}` : `${action} ${title}`;
}
