import { useState, type KeyboardEvent } from "react";
import { Heading } from "@/components/ui/Heading";
import { Stack } from "@/components/ui/Stack";
import { Text } from "@/components/ui/Text";
import { cn } from "@/utils/className";

const tones = [
  "bg-wash text-dark",
  "bg-teal-bg text-teal",
  "bg-blue-bg text-blue",
  "bg-amber-bg text-gold-d",
  "bg-gray-pill text-ink-2",
];

function labelFor(action: string, title: string, index: number, titles: string[]) {
  const duplicated = titles.filter((item) => item === title).length > 1;
  return duplicated ? `${action} ${title} ${index + 1}` : `${action} ${title}`;
}

function commitOnEnter(event: KeyboardEvent<HTMLInputElement>, commit: () => void) {
  if (event.key !== "Enter") return;
  event.preventDefault();
  if (event.nativeEvent.isComposing || event.keyCode === 229) return;
  commit();
}

export function CategoryBoard({
  names,
  onChange,
}: {
  names: string[];
  onChange: (names: string[]) => void;
}) {
  const [draft, setDraft] = useState("");
  const [editing, setEditing] = useState<number | null>(null);
  const [rename, setRename] = useState("");
  const titles = names.map((value) => value.trim() || "Empty");

  function add() {
    const value = draft.trim();
    if (!value) return;
    onChange([...names, value]);
    setDraft("");
  }

  function commitRename() {
    if (editing === null) return;
    const value = rename.trim();
    if (!value) return;
    const next = [...names];
    next[editing] = value;
    onChange(next);
    setEditing(null);
  }

  function remove(index: number) {
    onChange(names.filter((_, row) => row !== index));
    setEditing((current) => {
      if (current === null || current === index) return null;
      return current > index ? current - 1 : current;
    });
  }

  function startEdit(index: number) {
    setEditing(index);
    setRename(names[index] ?? "");
  }

  return (
    <section className="overflow-hidden rounded-lg border border-line bg-paper shadow-sm">
      <div className="grid md:grid-cols-[minmax(0,240px)_1fr]">
        <Stack className="justify-between gap-3 border-b border-line bg-wash-2 px-4 py-4 md:border-r md:border-b-0">
          <Stack className="gap-1">
            <Text variant="label" className="uppercase">
              Shelf
            </Text>
            <Heading level={3}>Categories</Heading>
            <Text variant="muted">
              Short labels a shopper browses by. The order here is the order that is saved.
            </Text>
          </Stack>
          <Text
            as="span"
            className="w-fit rounded-full bg-paper px-2.5 py-1 text-[11px] font-bold text-mid"
          >
            {names.length === 0
              ? "None yet"
              : names.length === 1
                ? "1 label"
                : `${names.length} labels`}
          </Text>
        </Stack>
        <Stack className="justify-center gap-3 px-4 py-4">
          <ul className="flex flex-wrap items-center gap-2">
            {titles.map((title, index) => {
              const editName = labelFor("Edit", title, index, titles);
              const removeName = labelFor("Remove", title, index, titles);
              const open = editing === index;
              return (
                <li
                  key={`${index}-${names[index] ?? ""}`}
                  className={cn(
                    "inline-flex max-w-full items-center rounded-full py-0.5 pr-1 pl-1.5",
                    tones[index % tones.length],
                  )}
                >
                  <span aria-hidden className="ml-1 size-1.5 shrink-0 rounded-full bg-current" />
                  {open ? (
                    <input
                      aria-label={editName}
                      value={rename}
                      autoFocus
                      enterKeyHint="done"
                      autoComplete="off"
                      spellCheck={false}
                      size={Math.min(28, Math.max(6, rename.length + 1))}
                      className="bg-transparent px-1.5 py-1 text-[13px] font-bold text-inherit outline-none focus:shadow-focus"
                      onChange={(event) => setRename(event.target.value)}
                      onKeyDown={(event) => {
                        if (event.key === "Escape") {
                          event.preventDefault();
                          setEditing(null);
                          return;
                        }
                        commitOnEnter(event, commitRename);
                      }}
                    />
                  ) : (
                    <button
                      type="button"
                      aria-label={editName}
                      className="max-w-[14rem] truncate rounded-full px-1.5 py-1 text-left text-[13px] font-bold focus-visible:shadow-focus focus-visible:outline-none"
                      onClick={() => startEdit(index)}
                    >
                      {title}
                    </button>
                  )}
                  {open ? (
                    <button
                      type="button"
                      aria-label={labelFor("Save", title, index, titles)}
                      className="mr-0.5 rounded-full bg-mid px-2 py-0.5 text-[11px] font-bold text-white focus-visible:shadow-focus focus-visible:outline-none"
                      onClick={commitRename}
                    >
                      Save
                    </button>
                  ) : (
                    <button
                      type="button"
                      aria-label={removeName}
                      className="grid size-7 shrink-0 place-items-center rounded-full text-[15px] leading-none text-current hover:bg-paper hover:text-rose focus-visible:shadow-focus focus-visible:outline-none"
                      onClick={() => remove(index)}
                    >
                      <span aria-hidden>×</span>
                    </button>
                  )}
                </li>
              );
            })}
            <li>
              <div className="inline-flex items-center rounded-full border border-dashed border-line-2 bg-paper py-0.5 pr-1 pl-3 focus-within:border-mid focus-within:shadow-focus">
                <span aria-hidden className="text-[15px] font-bold text-mid">
                  +
                </span>
                <input
                  aria-label="Add category"
                  placeholder="Skin, oral care…"
                  enterKeyHint="done"
                  autoComplete="off"
                  spellCheck={false}
                  value={draft}
                  className="w-36 bg-transparent px-2 py-1.5 text-[13px] font-bold text-dark outline-none placeholder:font-medium placeholder:text-faint"
                  onChange={(event) => setDraft(event.target.value)}
                  onKeyDown={(event) => commitOnEnter(event, add)}
                />
                <button
                  type="button"
                  aria-label="Add category"
                  disabled={!draft.trim()}
                  className="rounded-full bg-mid px-2.5 py-1 text-[11px] font-bold text-white focus-visible:shadow-focus focus-visible:outline-none disabled:bg-[#e9efeb] disabled:text-faint"
                  onClick={add}
                >
                  Add
                </button>
              </div>
            </li>
          </ul>
          {names.length === 0 ? (
            <Text variant="muted">Nothing on this shelf yet. Type a label and press Enter.</Text>
          ) : null}
        </Stack>
      </div>
    </section>
  );
}
