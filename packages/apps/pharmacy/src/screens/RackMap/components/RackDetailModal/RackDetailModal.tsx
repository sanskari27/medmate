import type { RackDetailModalProps } from "./RackDetailModal.types";
import { Box, Button, Heading, Input, Label, Text } from "@/components/atoms";
import { cn } from "@/utils/className";
import type { ChangeEvent, MouseEvent } from "react";
import { useState } from "react";
import { InvProduct, stockOf, hasLocation, locationCodes } from "@/utils";
import { Thumb } from "@/components/molecules";
import { IconSearch, IconX, IconFolder, IconBox } from "@/components/atoms";

const modalMotion = `
@keyframes rackFade { from { opacity: 0 } }
@keyframes rackPop { from { transform: translateY(14px) scale(.98); opacity: .6 } }
.rack-fade { animation: rackFade .16s ease }
.rack-pop { animation: rackPop .2s cubic-bezier(.2,.9,.3,1.2) }
`;

export function RackDetailModal({
  code,
  items,
  inventory,
  onClose,
  onAdd,
  onMed,
}: RackDetailModalProps) {
  const [pq, setPq] = useState("");
  const t = pq.trim().toLowerCase();
  const here = new Set(items.map((p) => p.id));
  const results = inventory
    .filter(
      (p) =>
        !here.has(p.id) &&
        (!t || `${p.name} ${p.composition} ${p.manufacturer}`.toLowerCase().includes(t)),
    )
    .slice(0, 8);
  return (
    <Box
      className="rack-fade fixed inset-0 z-[100] flex items-center justify-center bg-[rgba(13,32,21,0.5)] p-6 backdrop-blur-[3px] max-[767px]:items-end max-[767px]:p-0"
      onClick={onClose}
    >
      <style>{modalMotion}</style>
      <Box
        className="rack-pop flex max-h-[90vh] w-full max-w-[540px] flex-col overflow-hidden rounded-lg bg-paper shadow-pop max-[767px]:max-h-[92dvh] max-[767px]:max-w-none max-[767px]:rounded-t-2xl max-[767px]:rounded-b-none"
        onClick={stopPropagationOnClick}
      >
        <Box className="flex items-center justify-between border-b border-line px-5 py-4">
          <Heading level={3} className="!text-[17px]">
            <IconFolder size={16} /> Rack{" "}
            <Text
              className="!font-mono !text-[17px] !leading-[1.18] !font-extrabold !tracking-[-0.02em] !text-dark"
              as="span"
            >
              {code}
            </Text>
          </Heading>
          <Button
            className="!grid !h-8 !w-8 !place-items-center !rounded-sm !border-0 !bg-wash-2 !p-0 !text-lg !font-normal !text-ink-2 !shadow-none hover:!bg-wash hover:!text-ink-2 active:!translate-y-0"
            onClick={onClose}
          >
            <IconX size={18} />
          </Button>
        </Box>
        <Box className="overflow-y-auto p-5">
          {/* search + add */}
          <Box className="mb-2.5 flex flex-col gap-1.5">
            <Label>Add medicine to this rack</Label>
            <Box className="flex w-full max-w-[360px] min-w-[240px] flex-1 items-center gap-2 rounded-sm border border-line-2 bg-paper px-3 py-2 max-[767px]:min-w-0 max-[767px]:max-w-none">
              <Text className="!text-green" as="span">
                <IconSearch size={16} />
              </Text>
              <Input
                variant="plain"
                autoFocus
                placeholder="Search medicine by name, salt, brand…"
                value={pq}
                onChange={setPqOnChange}
                className="!h-auto !px-0 !py-0 !text-[13.5px] placeholder:!text-faint"
              />
            </Box>
          </Box>
          {pq.trim() && (
            <Box className="mb-3.5 rounded-md border border-line-2 bg-wash-2 p-2">
              <Box className="mt-1.5 flex max-h-[230px] flex-col gap-0.5 overflow-y-auto">
                {results.map(renderResult)}
                {results.length === 0 && (
                  <Box className="px-3 py-2.5 text-[12.5px] text-muted">
                    No other medicine matches “{pq}”.
                  </Box>
                )}
              </Box>
            </Box>
          )}

          {/* medicines currently in this rack */}
          <Box className={cn("!flex !items-center !gap-2.5", "!justify-between !mb-1.5")}>
            <Text as="span" className={cn("font-bold", "!text-[13px]")}>
              In this rack
            </Text>
            <Text className={cn("!text-muted", "!text-[12px]")} as="span">
              {items.length} item{items.length !== 1 ? "s" : ""}
            </Text>
          </Box>
          {items.length === 0 ? (
            <Box className="px-2.5 py-5 text-center text-muted">
              <Box className="mx-auto mb-3 grid h-11 w-11 place-items-center rounded-xl bg-wash text-[21px] leading-none text-mid">
                <IconBox size={28} />
              </Box>
              <Text className="!mx-auto !max-w-[340px] !text-[13px] !text-muted">
                No medicines here yet. Search above to add some.
              </Text>
            </Box>
          ) : (
            <Box className="flex max-h-[320px] flex-col overflow-y-auto rounded-md border border-line">
              {items.map(renderItem)}
            </Box>
          )}
        </Box>
        <Box className="mt-auto flex justify-end gap-2.5 border-t border-line px-5 py-3.5 max-[767px]:flex-wrap max-[767px]:[&_button]:flex-1">
          <Box className="!flex-1" />
          <Button
            className="!border-transparent !bg-mid !text-white !shadow-sm hover:!bg-green"
            onClick={onClose}
          >
            Done
          </Button>
        </Box>
      </Box>
    </Box>
  );
  function stopPropagationOnClick(e: MouseEvent<HTMLDivElement>) {
    return e.stopPropagation();
  }
  function setPqOnChange(e: ChangeEvent<HTMLInputElement>) {
    return setPq(e.target.value);
  }
  function renderResult(p: InvProduct) {
    return (
      <Button
        key={p.id}
        className="!block !h-auto !w-full !rounded-sm !border-0 !bg-transparent !px-[11px] !py-2 !text-left !text-[13px] !font-normal !text-ink !shadow-none hover:!bg-paper hover:!text-ink active:!translate-y-0"
        onClick={onAddOnClick}
      >
        <Text as="span" className="!text-[13px] !font-bold !text-dark">
          {p.name}
        </Text>
        <Text className="!text-[13px] !font-normal !text-muted" as="span">
          {" "}
          · {p.composition || p.manufacturer} · {stockOf(p)} in stock
          {hasLocation(p) ? ` · now at ${locationCodes(p).join(" · ")}` : ""}
        </Text>
      </Button>
    );
    function onAddOnClick() {
      return onAdd(p.id);
    }
  }
  function renderItem(p: InvProduct) {
    return (
      <Box
        className="flex items-center gap-[9px] border-b border-line px-3.5 py-2 last:border-b-0"
        key={p.id}
      >
        <Button
          className="!flex !h-auto !min-w-0 !flex-1 !items-center !gap-[9px] !rounded-none !border-0 !bg-transparent !p-0 !text-left !font-normal !text-inherit !shadow-none hover:!bg-wash-2 hover:!text-inherit active:!translate-y-0"
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
            {stockOf(p)}
          </Text>
        </Button>
      </Box>
    );
    function onMedOnClick() {
      return onMed(p.id);
    }
  }
}
