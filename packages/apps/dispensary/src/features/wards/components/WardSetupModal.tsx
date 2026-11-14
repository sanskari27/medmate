import { useId, useState, type ChangeEvent, type ReactNode } from "react";
import { Box } from "@/components/ui/Box";
import { Button } from "@/components/ui/Button";
import { IconPlus } from "@/components/ui/Icon";
import { Input } from "@/components/ui/Input";
import { Label } from "@/components/ui/Label";
import { Select } from "@/components/ui/Select";
import { Text } from "@/components/ui/Text";
import { cn } from "@/utils/className";
import {
  WARD_CATEGORIES,
  bedLabels,
  blankWard,
  heldLabels,
  wardPayload,
  type Ward,
  type WardCategory,
  type WardDraft,
  type WardPayload,
} from "../model";
import { WardDialog } from "./WardDialog";

const field =
  "flex flex-col gap-1.5 [&_label]:text-[11.5px] [&_label]:font-bold [&_label]:tracking-wide [&_label]:text-ink-2";
const span2 = "min-[768px]:col-span-2";
const span4 = "min-[768px]:col-span-4";
const span6 = "min-[768px]:col-span-6";

const CATEGORY_TONE: Record<WardCategory, string> = {
  ICU: "bg-rose-bg text-rose",
  General: "bg-gray-pill text-muted",
  Surgical: "bg-blue-bg text-blue",
  Pediatric: "bg-amber-bg text-gold-d",
  Maternity: "bg-teal-bg text-teal",
  Private: "bg-wash text-mid",
};

export function WardSetupModal({
  wards,
  canCreate,
  canUpdate,
  error,
  onClose,
  onCreate,
  onUpdate,
}: {
  wards: Ward[];
  canCreate: boolean;
  canUpdate: boolean;
  error: string | null;
  onClose: () => void;
  onCreate: (body: WardPayload) => void;
  onUpdate: (id: string, body: Partial<WardPayload>) => void;
}) {
  const [picked, setPicked] = useState<string | null>(null);
  const [draft, setDraft] = useState<WardDraft>(blankWard());
  const showingNew = picked === "new" || (picked === null && wards.length === 0 && canCreate);
  const selected = showingNew ? null : (wards.find((ward) => ward.id === picked) ?? wards[0] ?? null);
  const beds = Number(draft.beds) || 0;
  const ready = draft.name.trim().length > 0 && draft.code.trim().length > 0;

  function createWard() {
    if (!ready) return;
    onCreate(wardPayload(draft));
    setDraft(blankWard());
    setPicked("new");
  }

  return (
    <WardDialog
      wide
      flush
      title="Manage wards & beds"
      subtitle={canUpdate ? "Edits save when you leave a field." : undefined}
      error={error}
      onClose={onClose}
      footer={
        <>
          <Button type="button" variant={showingNew ? "ghost" : "primary"} onClick={onClose}>
            Done
          </Button>
          {showingNew ? (
            <Button type="submit" form="new-ward" disabled={!ready}>
              <IconPlus size={15} /> Add ward
            </Button>
          ) : null}
        </>
      }
    >
      <Box className="grid grid-cols-1 md:grid-cols-[248px_minmax(0,1fr)]">
        <Box className="border-b border-line bg-canvas md:border-r md:border-b-0">
          <Box className="flex max-h-52 flex-col overflow-hidden md:sticky md:top-0 md:max-h-none md:overflow-visible">
            {canCreate ? (
              <button
                type="button"
                aria-current={showingNew ? "true" : undefined}
                className={cn(
                  "flex items-center gap-2 border-b border-line px-3.5 py-3 text-left text-[13px] font-bold",
                  showingNew ? "bg-paper text-mid" : "text-ink-2 hover:bg-wash",
                )}
                onClick={() => setPicked("new")}
              >
                <IconPlus size={15} /> New ward
              </button>
            ) : null}
            <Box className="scroll-hint min-h-0 flex-1 overflow-y-auto">
              {wards.length === 0 ? (
                <Text className="px-3.5 py-4 text-[12.5px] text-muted">No wards yet</Text>
              ) : (
                wards.map((ward) => {
                  const active = selected?.id === ward.id;
                  return (
                    <button
                      key={ward.id}
                      type="button"
                      aria-current={active ? "true" : undefined}
                      className={cn(
                        "flex w-full flex-col gap-1 border-l-2 px-3.5 py-3 text-left",
                        active ? "border-mid bg-paper" : "border-transparent hover:bg-wash",
                      )}
                      onClick={() => setPicked(ward.id)}
                    >
                      <Text
                        as="span"
                        className="truncate font-display text-[13.5px] font-extrabold text-dark"
                      >
                        {ward.name}
                      </Text>
                      <Box className="flex flex-wrap items-center gap-1.5">
                        <CategoryPill category={ward.category} />
                        {ward.underMaintenance ? (
                          <Text as="span" className="text-[11px] font-bold text-amber">
                            Maintenance
                          </Text>
                        ) : null}
                      </Box>
                      <Text as="span" className="text-[12px] text-muted">
                        {ward.code} · {ward.beds} beds
                        {ward.floor ? ` · ${ward.floor}` : ""}
                      </Text>
                    </button>
                  );
                })
              )}
            </Box>
          </Box>
        </Box>
        <Box className="p-5">
          {showingNew ? (
            <CreatePanel draft={draft} beds={beds} onChange={setDraft} onSubmit={createWard} />
          ) : selected ? (
            <EditPanel key={selected.id} ward={selected} canUpdate={canUpdate} onUpdate={onUpdate} />
          ) : (
            <Text className="text-[13px] text-muted">No wards to edit.</Text>
          )}
        </Box>
      </Box>
    </WardDialog>
  );
}

function CreatePanel({
  draft,
  beds,
  onChange,
  onSubmit,
}: {
  draft: WardDraft;
  beds: number;
  onChange: (draft: WardDraft) => void;
  onSubmit: () => void;
}) {
  return (
    <form
      id="new-ward"
      onSubmit={(event) => {
        event.preventDefault();
        onSubmit();
      }}
    >
      <PanelTitle eyebrow="New ward" title="Add a ward" category={draft.category} />
      <Box className="grid grid-cols-1 gap-3.5 min-[768px]:grid-cols-6">
        <Box className={`${field} ${span4}`}>
          <Label htmlFor="ward-name">Ward name</Label>
          <Input
            id="ward-name"
            autoFocus
            value={draft.name}
            placeholder="e.g. Orthopaedic Ward"
            onChange={(event) => onChange({ ...draft, name: event.target.value })}
          />
        </Box>
        <Box className={`${field} ${span2}`}>
          <Label htmlFor="ward-category">Category</Label>
          <Select
            id="ward-category"
            className="w-full"
            value={draft.category}
            onChange={(event) =>
              onChange({ ...draft, category: event.target.value as WardCategory })
            }
          >
            {WARD_CATEGORIES.map((category) => (
              <option key={category} value={category}>
                {category}
              </option>
            ))}
          </Select>
        </Box>
        <Box className={`${field} ${span2}`}>
          <Label htmlFor="ward-code">Code / bed prefix</Label>
          <Input
            id="ward-code"
            className="font-mono"
            value={draft.code}
            placeholder="ORT"
            onChange={(event) => onChange({ ...draft, code: event.target.value.toUpperCase() })}
          />
        </Box>
        <Box className={`${field} ${span2}`}>
          <Label htmlFor="ward-floor">Floor</Label>
          <Input
            id="ward-floor"
            value={draft.floor}
            placeholder="3rd floor"
            onChange={(event) => onChange({ ...draft, floor: event.target.value })}
          />
        </Box>
        <Box className={`${field} ${span2}`}>
          <Label htmlFor="ward-sister">Nurse in-charge</Label>
          <Input
            id="ward-sister"
            value={draft.sister}
            placeholder="Sr. …"
            onChange={(event) => onChange({ ...draft, sister: event.target.value })}
          />
        </Box>
        <Box className={`${field} ${span2}`}>
          <Label htmlFor="ward-beds">Bed capacity</Label>
          <Input
            id="ward-beds"
            type="number"
            min={1}
            value={draft.beds}
            onChange={(event) => onChange({ ...draft, beds: event.target.value })}
          />
        </Box>
        <Box className={`${field} ${span2}`}>
          <Label htmlFor="ward-held">Beds held</Label>
          <Input
            id="ward-held"
            type="number"
            min={0}
            value={draft.bedsHeld}
            onChange={(event) => onChange({ ...draft, bedsHeld: event.target.value })}
          />
        </Box>
        <Box className={`${field} ${span2}`}>
          <Label htmlFor="ward-rate">Daily rate</Label>
          <Input
            id="ward-rate"
            value={draft.dailyRate}
            onChange={(event) => onChange({ ...draft, dailyRate: event.target.value })}
          />
        </Box>
        <Box className={span6}>
          <BedPreview code={draft.code} beds={beds} held={Number(draft.bedsHeld) || 0} />
        </Box>
      </Box>
      <MaintenanceRow
        checked={draft.underMaintenance}
        note={draft.maintenanceNote}
        live
        onChecked={(underMaintenance) => onChange({ ...draft, underMaintenance })}
        onNote={(maintenanceNote) => onChange({ ...draft, maintenanceNote })}
      />
    </form>
  );
}

function EditPanel({
  ward,
  canUpdate,
  onUpdate,
}: {
  ward: Ward;
  canUpdate: boolean;
  onUpdate: (id: string, body: Partial<WardPayload>) => void;
}) {
  const base = useId();
  return (
    <Box>
      <PanelTitle eyebrow={ward.code} title={ward.name} category={ward.category} />
      <Box className="grid grid-cols-1 gap-3.5 min-[768px]:grid-cols-6">
        <CommitField
          className={span4}
          id={`${base}-name`}
          label="Ward name"
          value={ward.name}
          readOnly={!canUpdate}
          autoFocus={canUpdate}
          onCommit={(name) => onUpdate(ward.id, { name })}
        />
        <Box className={`${field} ${span2}`}>
          <Label htmlFor={`${base}-category`}>Category</Label>
          {canUpdate ? (
            <Select
              id={`${base}-category`}
              className="w-full"
              value={ward.category}
              onChange={(event) =>
                onUpdate(ward.id, { category: event.target.value as WardCategory })
              }
            >
              {WARD_CATEGORIES.map((category) => (
                <option key={category} value={category}>
                  {category}
                </option>
              ))}
            </Select>
          ) : (
            <CategoryPill category={ward.category} />
          )}
        </Box>
        <CommitField
          className={span2}
          id={`${base}-code`}
          label="Code / bed prefix"
          value={ward.code}
          mono
          readOnly={!canUpdate}
          onCommit={(code) => onUpdate(ward.id, { code: code.toUpperCase() })}
        />
        <CommitField
          className={span2}
          id={`${base}-floor`}
          label="Floor"
          value={ward.floor ?? ""}
          readOnly={!canUpdate}
          onCommit={(floor) => onUpdate(ward.id, { floor: floor || null })}
        />
        <CommitField
          className={span2}
          id={`${base}-sister`}
          label="Nurse in-charge"
          value={ward.sister ?? ""}
          readOnly={!canUpdate}
          onCommit={(sister) => onUpdate(ward.id, { sister: sister || null })}
        />
        <CommitField
          className={span2}
          id={`${base}-beds`}
          label="Bed capacity"
          value={String(ward.beds)}
          readOnly={!canUpdate}
          onCommit={(value) => onUpdate(ward.id, { beds: Number(value) })}
        />
        <CommitField
          className={span2}
          id={`${base}-held`}
          label="Beds held"
          value={String(ward.bedsHeld)}
          readOnly={!canUpdate}
          onCommit={(value) => onUpdate(ward.id, { bedsHeld: Number(value) })}
        />
        <CommitField
          className={span2}
          id={`${base}-rate`}
          label="Daily rate"
          value={ward.dailyRate}
          readOnly={!canUpdate}
          onCommit={(dailyRate) => onUpdate(ward.id, { dailyRate })}
        />
        <Box className={span6}>
          <BedPreview code={ward.code} beds={ward.beds} held={ward.bedsHeld} />
        </Box>
      </Box>
      <MaintenanceRow
        id={`${base}-maintenance`}
        checked={ward.underMaintenance}
        note={ward.maintenanceNote ?? ""}
        readOnly={!canUpdate}
        onChecked={(underMaintenance) => onUpdate(ward.id, { underMaintenance })}
        onNote={(maintenanceNote) =>
          onUpdate(ward.id, { maintenanceNote: maintenanceNote.trim() || null })
        }
      />
    </Box>
  );
}

function PanelTitle({
  eyebrow,
  title,
  category,
}: {
  eyebrow: string;
  title: string;
  category: WardCategory;
}) {
  return (
    <Box className="mb-4 flex items-start justify-between gap-3">
      <Box>
        <Text className="text-[11px] font-bold tracking-[0.07em] text-muted uppercase">
          {eyebrow}
        </Text>
        <Text className="font-display text-[18px] font-extrabold tracking-[-0.02em] text-dark">
          {title}
        </Text>
      </Box>
      <CategoryPill category={category} />
    </Box>
  );
}

function Field({
  label,
  htmlFor,
  className,
  children,
}: {
  label: string;
  htmlFor?: string;
  className?: string;
  children: ReactNode;
}) {
  return (
    <Box className={cn(field, className)}>
      <Label htmlFor={htmlFor}>{label}</Label>
      {children}
    </Box>
  );
}

function CommitField({
  id,
  label,
  value,
  readOnly,
  mono,
  autoFocus,
  className,
  onCommit,
}: {
  id: string;
  label: string;
  value: string;
  readOnly: boolean;
  mono?: boolean;
  autoFocus?: boolean;
  className?: string;
  onCommit: (value: string) => void;
}) {
  const [text, setText] = useState(value);
  return (
    <Field className={className} label={label} htmlFor={readOnly ? undefined : id}>
      {readOnly ? (
        <Text className={cn("text-[13.5px] text-ink", mono && "font-mono")}>{value || "—"}</Text>
      ) : (
        <Input
          id={id}
          autoFocus={autoFocus}
          aria-label={label}
          className={mono ? "font-mono" : undefined}
          value={text}
          onChange={(event: ChangeEvent<HTMLInputElement>) => setText(event.target.value)}
          onBlur={() => {
            if (text !== value) onCommit(text);
          }}
        />
      )}
    </Field>
  );
}

function MaintenanceRow({
  id,
  checked,
  note,
  live,
  readOnly,
  onChecked,
  onNote,
}: {
  id?: string;
  checked: boolean;
  note: string;
  live?: boolean;
  readOnly?: boolean;
  onChecked: (value: boolean) => void;
  onNote: (value: string) => void;
}) {
  const noteId = useId();
  const [text, setText] = useState(note);
  return (
    <Box className="mt-4 rounded-md border border-line bg-wash-2 px-3.5 py-3">
      <Label htmlFor={id} className="flex items-start gap-2.5 text-[13px]">
        <input
          id={id}
          type="checkbox"
          className="mt-0.5 size-4 accent-mid"
          checked={checked}
          disabled={readOnly}
          onChange={(event) => onChecked(event.target.checked)}
        />
        <Box>
          <Text as="span" className="block font-bold text-ink">
            Under maintenance
          </Text>
          <Text as="span" className="text-[12px] font-medium text-muted">
            Free beds stay closed until this is cleared.
          </Text>
        </Box>
      </Label>
      {checked ? (
        <Box className="mt-3">
          {readOnly ? (
            <Text className="text-[13px] text-ink">{note || "No note"}</Text>
          ) : (
            <Field label="Maintenance note" htmlFor={noteId}>
              <Input
                id={noteId}
                aria-label="Maintenance note"
                value={live ? note : text}
                placeholder="What is closed, and until when"
                onChange={(event) => {
                  if (live) onNote(event.target.value);
                  else setText(event.target.value);
                }}
                onBlur={() => {
                  if (!live && text !== note) onNote(text);
                }}
              />
            </Field>
          )}
        </Box>
      ) : null}
    </Box>
  );
}

function BedPreview({ code, beds, held }: { code: string; beds: number; held: number }) {
  const prefix = code.trim() || "CODE";
  const labels = bedLabels(prefix, beds);
  const heldSet = new Set(heldLabels(prefix, beds, held));
  const head = labels.slice(0, 6);
  const heldTail = labels.filter((bed) => heldSet.has(bed) && !head.includes(bed));
  const hidden = labels.length - head.length - heldTail.length;
  return (
    <Box>
      <Text className="mb-2 text-[11.5px] font-bold tracking-wide text-ink-2">Bed labels</Text>
      {labels.length === 0 ? (
        <Text className="text-[12.5px] text-muted">Add a capacity to preview bed labels.</Text>
      ) : (
        <Box className="flex flex-wrap items-center gap-1.5">
          {head.map((bed) => (
            <BedChip key={bed} bed={bed} held={heldSet.has(bed)} />
          ))}
          {hidden > 0 ? (
            <Text as="span" className="px-1 text-[12px] font-bold text-muted">
              +{hidden}
            </Text>
          ) : null}
          {heldTail.map((bed) => (
            <BedChip key={bed} bed={bed} held />
          ))}
        </Box>
      )}
      {held > 0 ? (
        <Text className="mt-2 text-[12px] text-muted">
          {held === 1
            ? "The last bed is held and stays off the free list."
            : `The last ${held} beds are held and stay off the free list.`}
        </Text>
      ) : null}
    </Box>
  );
}

function BedChip({ bed, held }: { bed: string; held: boolean }) {
  return (
    <Text
      as="span"
      className={cn(
        "rounded-full px-2 py-0.5 font-mono text-[10.5px] font-bold",
        held ? "bg-amber-bg text-gold-d" : "bg-wash text-mid",
      )}
    >
      {bed}
    </Text>
  );
}

function CategoryPill({ category }: { category: WardCategory }) {
  return (
    <Text
      as="span"
      className={cn(
        "inline-flex shrink-0 items-center rounded-full px-[9px] py-[3px] text-[11px] font-bold",
        CATEGORY_TONE[category],
      )}
    >
      {category}
    </Text>
  );
}
