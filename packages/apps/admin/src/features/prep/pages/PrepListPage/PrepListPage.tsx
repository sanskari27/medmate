import { useState, type FormEvent } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/Button";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { Field } from "@/components/ui/Field";
import { Heading } from "@/components/ui/Heading";
import { Input } from "@/components/ui/Input";
import { Stack } from "@/components/ui/Stack";
import { Text } from "@/components/ui/Text";
import {
  useCreatePrepMutation,
  useDeletePrepMutation,
  useListPrepsQuery,
  useRenamePrepMutation,
} from "../../prep.api";
import { problemMessage } from "../../problemMessage";

function when(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return new Intl.DateTimeFormat("en-IN", { dateStyle: "medium", timeStyle: "short" }).format(date);
}

export function PrepListPage() {
  const navigate = useNavigate();
  const list = useListPrepsQuery();
  const [createPrep, createState] = useCreatePrepMutation();
  const [renamePrep, renameState] = useRenamePrepMutation();
  const [deletePrep, deleteState] = useDeletePrepMutation();
  const [name, setName] = useState("");
  const [editing, setEditing] = useState<string | null>(null);
  const [draft, setDraft] = useState("");
  const [pendingDelete, setPendingDelete] = useState<{ id: string; name: string } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const rows = list.data?.lists ?? [];

  async function create(event: FormEvent) {
    event.preventDefault();
    setError(null);
    try {
      const created = await createPrep({ name }).unwrap();
      navigate(`/inventory-prep/${created.list.id}`);
    } catch (caught) {
      setError(problemMessage(caught, "Could not create the list."));
    }
  }

  async function rename(id: string) {
    setError(null);
    try {
      await renamePrep({ id, name: draft }).unwrap();
      setEditing(null);
    } catch (caught) {
      setError(problemMessage(caught, "Could not rename the list."));
    }
  }

  async function remove() {
    if (!pendingDelete) return;
    setError(null);
    try {
      await deletePrep(pendingDelete.id).unwrap();
      setPendingDelete(null);
    } catch (caught) {
      setError(problemMessage(caught, "Could not delete the list."));
    }
  }

  return (
    <Stack className="gap-4">
      <section className="rounded-xl border border-line bg-paper p-4 shadow-sm sm:p-5">
        <Heading level={2} id="prep-create-heading" className="mb-1 text-[18px]">
          Your lists
        </Heading>
        <Text variant="muted" className="mb-4">
          A list stays on this account until you export it and hand the file to the pharmacy.
        </Text>
        <form aria-labelledby="prep-create-heading" onSubmit={(event) => void create(event)}>
          <Stack direction="row" align="end" wrap className="gap-3">
            <Field label="Name" htmlFor="prep-name" className="min-w-[220px] flex-1">
              <Input
                id="prep-name"
                name="name"
                value={name}
                maxLength={80}
                required
                autoComplete="off"
                onChange={(event) => setName(event.target.value)}
              />
            </Field>
            <Button type="submit" disabled={createState.isLoading}>
              Create
            </Button>
          </Stack>
        </form>
        {error ? (
          <Text role="alert" className="mt-3 text-[13px] font-bold text-rose">
            {error}
          </Text>
        ) : null}
        {list.isError ? (
          <Text role="alert" className="mt-3 text-[13px] font-bold text-rose">
            {problemMessage(list.error, "Could not load lists.")}
          </Text>
        ) : null}
      </section>
      <section className="overflow-hidden rounded-xl border border-line bg-paper shadow-sm">
        {rows.length === 0 ? (
          <Text className="px-4 py-10 text-center text-[13.5px] text-muted">No lists yet.</Text>
        ) : (
          <div className="overflow-x-auto" role="region" aria-label="Your lists" tabIndex={0}>
            <table className="w-full min-w-[640px] border-separate border-spacing-0 text-left">
              <caption className="sr-only">Your lists</caption>
              <thead>
                <tr>
                  <th
                    scope="col"
                    className="border-b border-line bg-wash-2 px-4 py-3 text-[12px] font-bold tracking-wide text-muted uppercase"
                  >
                    Name
                  </th>
                  <th
                    scope="col"
                    className="border-b border-line bg-wash-2 px-4 py-3 text-[12px] font-bold tracking-wide text-muted uppercase"
                  >
                    Rows
                  </th>
                  <th
                    scope="col"
                    className="border-b border-line bg-wash-2 px-4 py-3 text-[12px] font-bold tracking-wide text-muted uppercase"
                  >
                    Updated
                  </th>
                  <th scope="col" className="border-b border-line bg-wash-2 px-4 py-3">
                    <span className="sr-only">Actions</span>
                  </th>
                </tr>
              </thead>
              <tbody>
                {rows.map((row) => (
                  <tr key={row.id}>
                    <th scope="row" className="border-b border-line px-4 py-3 font-normal">
                      {editing === row.id ? (
                        <form
                          className="flex flex-wrap items-center gap-2"
                          onSubmit={(event) => {
                            event.preventDefault();
                            void rename(row.id);
                          }}
                        >
                          <label className="sr-only" htmlFor={`rename-${row.id}`}>
                            Name
                          </label>
                          <Input
                            id={`rename-${row.id}`}
                            value={draft}
                            maxLength={80}
                            required
                            onChange={(event) => setDraft(event.target.value)}
                          />
                          <Button type="submit" size="sm" disabled={renameState.isLoading}>
                            Save name
                          </Button>
                        </form>
                      ) : (
                        <Link
                          to={`/inventory-prep/${row.id}`}
                          className="font-bold text-mid underline-offset-2 hover:underline"
                        >
                          {row.name}
                        </Link>
                      )}
                    </th>
                    <td className="border-b border-line px-4 py-3 tabular-nums">{row.lineCount}</td>
                    <td className="border-b border-line px-4 py-3 text-muted">
                      {when(row.updatedAt)}
                    </td>
                    <td className="border-b border-line px-4 py-3">
                      <Stack direction="row" className="justify-end gap-2">
                        <Button
                          type="button"
                          variant="line"
                          size="sm"
                          onClick={() => {
                            setEditing(row.id);
                            setDraft(row.name);
                          }}
                        >
                          Rename
                        </Button>
                        <Button
                          type="button"
                          variant="rose"
                          size="sm"
                          aria-label={`Delete ${row.name}`}
                          onClick={() => setPendingDelete({ id: row.id, name: row.name })}
                        >
                          Delete
                        </Button>
                      </Stack>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
      {pendingDelete ? (
        <ConfirmDialog
          title={`Delete ${pendingDelete.name}?`}
          body="This list and its rows are removed."
          tone="danger"
          busy={deleteState.isLoading}
          onClose={() => setPendingDelete(null)}
        >
          <Button type="button" variant="line" onClick={() => setPendingDelete(null)}>
            Keep
          </Button>
          <Button
            type="button"
            variant="rose"
            disabled={deleteState.isLoading}
            onClick={() => void remove()}
          >
            Delete
          </Button>
        </ConfirmDialog>
      ) : null}
    </Stack>
  );
}
