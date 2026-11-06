import type { RackMapProps } from "./RackMap.types";
import { Box, Button, Input, Text } from "@/components/atoms";
import { cn } from "@/utils/className";
import type { ChangeEvent, KeyboardEvent } from "react";
import { useState } from "react";
import { InvProduct, stockOf, matchesLocation } from "@/utils";
import { Thumb } from "@/components/molecules";
import { IconPlus, IconMap, IconHelp, IconFolder } from "@/components/atoms";
export function RackMap({
  groups,
  q,
  unassigned,
  onGoAssign,
  createRack,
  onOpen,
  onMed,
}: RackMapProps) {
  const t = q.trim().toLowerCase();
  const [nextRack, setNextRack] = useState("");
  const matchProd = (p: InvProduct) =>
    !t ||
    `${p.name} ${p.composition} ${p.manufacturer}`.toLowerCase().includes(t) ||
    matchesLocation(p, t);
  const shown = groups
    .map((g) => ({ ...g, items: g.items.filter(matchProd) }))
    .filter((g) => (!t ? true : g.items.length > 0 || g.code.toLowerCase().includes(t)));
  const submitNew = async () => {
    if (nextRack.trim() && (await createRack(nextRack))) setNextRack("");
  };
  return (
    <>
      {/* create a rack manually */}
      <Box className="mb-3.5 flex flex-row flex-wrap items-center gap-3 rounded-md border border-line bg-paper p-[18px] shadow-sm">
        <Text as="span" className={cn("font-bold", "!text-[13px]")}>
          <IconFolder size={15} /> Create a rack
        </Text>
        <Input
          data-field="rack"
          value={nextRack}
          onChange={setNextRackOnChange}
          onKeyDown={submitNewOnKeyDown}
          placeholder="e.g. A3-12"
          className="!w-[130px] !shrink-0 !font-mono"
        />
        <Button
          className="!border-transparent !bg-mid !text-white !shadow-sm hover:!bg-green !h-auto !rounded-xs !px-[11px] !py-1.5 !text-xs"
          disabled={!nextRack.trim()}
          onClick={submitNew}
        >
          <IconPlus size={14} /> Add rack
        </Button>
        <Text
          className={cn("!text-muted", "!text-[11.5px] !flex-[1_1_100%] !leading-[1.5]")}
          as="span"
        >
          Make the on-screen code identical to the printed shelf label. Click any rack below to add
          / arrange medicines inside it.
        </Text>
      </Box>

      {unassigned.length > 0 && !t && (
        <Box className="mb-3.5 flex flex-row items-center gap-3 rounded-md border border-line bg-amber-bg p-[18px] shadow-sm">
          <Text className={cn("!text-[22px]")} as="span">
            <IconHelp size={22} />
          </Text>
          <Box className={cn("!flex-1")}>
            <Text as="span" className={cn("font-bold", "!text-[13.5px]")}>
              {unassigned.length} medicine{unassigned.length !== 1 ? "s" : ""} have no rack location
              yet
            </Text>
            <Box className={cn("!text-muted", "!text-[12px]")}>
              Assign them so staff can find stock on the shelves quickly.
            </Box>
          </Box>
          <Button
            className="!border-transparent !bg-mid !text-white !shadow-sm hover:!bg-green !h-auto !rounded-xs !px-[11px] !py-1.5 !text-xs"
            onClick={onGoAssign}
          >
            Assign now →
          </Button>
        </Box>
      )}

      {shown.length === 0 ? (
        <Box className="rounded-md border border-line bg-paper shadow-sm">
          <Box className="px-5 py-9 text-center text-muted">
            <Box className="mx-auto mb-3 grid h-11 w-11 place-items-center rounded-xl bg-wash text-[21px] leading-none text-mid">
              <IconMap size={28} />
            </Box>
            <Text className="!mx-auto !max-w-[340px] !text-[13px] !text-muted">
              {q ? `No locations match “${q}”.` : "No racks yet — create one above."}
            </Text>
          </Box>
        </Box>
      ) : (
        <Box className="grid grid-cols-[repeat(auto-fill,minmax(280px,1fr))] items-start gap-3.5">
          {shown.map(renderShown)}
        </Box>
      )}
    </>
  );
  function setNextRackOnChange(event: ChangeEvent<HTMLInputElement>) {
    return setNextRack(event.target.value.toUpperCase());
  }
  function submitNewOnKeyDown(e: KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Enter") void submitNew();
  }
  function renderShown(g: { items: InvProduct[]; code: string; zone: string }) {
    return (
      <Box
        className="!overflow-hidden !rounded-md !border !border-line !bg-paper !transition hover:!border-line-2 hover:!shadow-[0_6px_18px_rgba(27,61,41,0.07)]"
        key={g.code}
      >
        <Button
          className="!flex !h-auto !w-full !items-center !justify-between !rounded-none !border-0 !border-b !border-line !bg-wash-2 !px-3.5 !py-[11px] !text-left !font-normal !text-inherit !shadow-none hover:!bg-wash hover:!text-inherit active:!translate-y-0"
          onClick={onOpenOnClick}
          title={`Manage rack ${g.code}`}
        >
          <Text
            className="font-mono text-base font-extrabold tracking-[0.04em] text-dark"
            as="span"
          >
            {g.code}
          </Text>
          <Text className="!text-[11.5px] !font-normal !text-muted" as="span">
            {g.items.length} item{g.items.length !== 1 ? "s" : ""} · manage ›
          </Text>
        </Button>
        <Box className="flex max-h-[210px] flex-col overflow-y-auto">
          {g.items.map(renderItem)}
          {g.items.length === 0 && (
            <Button
              onClick={onOpenOnClick2}
              className="!flex !h-auto !w-full !cursor-pointer !items-center !justify-center !rounded-none !border-0 !bg-transparent !px-3.5 !py-2 !text-[12px] !font-normal !text-muted !shadow-none hover:!bg-wash-2 hover:!text-muted active:!translate-y-0"
            >
              Empty — click to add medicines
            </Button>
          )}
        </Box>
      </Box>
    );
    function onOpenOnClick() {
      return onOpen(g.code);
    }
    function renderItem(p: InvProduct) {
      return (
        <Button
          className="!flex !h-auto !w-full !items-center !gap-[9px] !rounded-none !border-0 !border-b !border-line !bg-transparent !px-3.5 !py-2 !text-left !font-normal !text-inherit !shadow-none last:!border-b-0 hover:!bg-wash-2 hover:!text-inherit active:!translate-y-0"
          key={p.id}
          onClick={onMedOnClick}
          title="View medicine details"
        >
          <Text
            className="!grid !h-[30px] !w-[30px] !shrink-0 !place-items-center !overflow-hidden !rounded-[7px] !bg-wash !text-base !text-mid"
            as="span"
          >
            <Thumb p={p} />
          </Text>
          <Text
            className="!min-w-0 !flex-1 !truncate !text-[12.5px] !font-bold !text-ink"
            as="span"
          >
            {p.name}
            <Text className="!text-[11px] !font-normal !text-muted" as="span">
              {" "}
              · {p.composition}
            </Text>
          </Text>
          <Text
            className={`!inline-flex !shrink-0 !items-center !gap-[5px] !rounded-full !px-[9px] !py-[3px] !text-[11px] !font-bold !whitespace-nowrap ${stockOf(p) === 0 ? "!bg-rose-bg !text-rose" : "!bg-gray-pill !text-muted"}`}
            as="span"
          >
            {stockOf(p)} in stock
          </Text>
        </Button>
      );
      function onMedOnClick() {
        return onMed(p.id);
      }
    }
    function onOpenOnClick2() {
      return onOpen(g.code);
    }
  }
}
