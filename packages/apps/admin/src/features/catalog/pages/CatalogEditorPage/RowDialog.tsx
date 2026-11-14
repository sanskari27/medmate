import { useId, useState, type FormEvent } from "react";
import { Button } from "@/components/ui/Button";
import { Field } from "@/components/ui/Field";
import { Input } from "@/components/ui/Input";
import { Stack } from "@/components/ui/Stack";
import { useDialogClose } from "../../dialog";
import { ModalDialog } from "../../modal";
import type { ChildList } from "../../model";
import { singular } from "./entryName";

const areaClass =
  "w-full rounded-sm border border-line-2 bg-paper px-3 py-[9px] text-[13.5px] text-ink outline-none hover:border-[#b9d0c2] focus:border-mid focus:shadow-focus";

function RowForm({
  list,
  initial,
  mode,
  onSave,
}: {
  list: ChildList;
  initial: Record<string, string>;
  mode: "add" | "edit";
  onSave: (values: Record<string, string>) => void;
}) {
  const formId = useId();
  const close = useDialogClose();
  const [values, setValues] = useState(initial);

  function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    onSave(values);
  }

  const prose = new Set(["detail", "answer"]);

  return (
    <form className="grid gap-4" onSubmit={onSubmit}>
      {list.shape === "text" ? (
        <Field label={`${singular(list.label)} *`} htmlFor={`${formId}-value`}>
          <Input
            id={`${formId}-value`}
            name="value"
            value={values.value ?? ""}
            required
            autoFocus
            autoComplete="off"
            onChange={(event) => setValues({ value: event.target.value })}
          />
        </Field>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2">
          {list.columns.map((column, index) => {
            const id = `${formId}-${column.key}`;
            const long = prose.has(column.key);
            return (
              <Field
                key={column.key}
                label={column.required ? `${column.label} *` : column.label}
                htmlFor={id}
                className={long ? "sm:col-span-2" : undefined}
              >
                {long ? (
                  <textarea
                    id={id}
                    name={column.key}
                    className={areaClass}
                    rows={3}
                    value={values[column.key] ?? ""}
                    required={column.required}
                    autoFocus={index === 0}
                    autoComplete="off"
                    onChange={(event) =>
                      setValues((current) => ({ ...current, [column.key]: event.target.value }))
                    }
                  />
                ) : (
                  <Input
                    id={id}
                    name={column.key}
                    value={values[column.key] ?? ""}
                    required={column.required}
                    autoFocus={index === 0}
                    autoComplete="off"
                    inputMode={column.numeric ? "decimal" : undefined}
                    onChange={(event) =>
                      setValues((current) => ({ ...current, [column.key]: event.target.value }))
                    }
                  />
                )}
              </Field>
            );
          })}
        </div>
      )}
      <Stack direction="row" justify="end" className="gap-2">
        <Button type="button" variant="ghost" onClick={close}>
          Cancel
        </Button>
        <Button type="submit">{mode === "add" ? "Add" : "Save"}</Button>
      </Stack>
    </form>
  );
}

export function RowDialog({
  title,
  list,
  initial,
  mode,
  onClose,
  onSave,
}: {
  title: string;
  list: ChildList;
  initial: Record<string, string>;
  mode: "add" | "edit";
  onClose: () => void;
  onSave: (values: Record<string, string>) => void;
}) {
  const titleId = useId();
  return (
    <ModalDialog title={title} titleId={titleId} onClose={onClose}>
      <RowForm list={list} initial={initial} mode={mode} onSave={onSave} />
    </ModalDialog>
  );
}
