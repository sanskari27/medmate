import type { RackMapProps } from "./RackMap.types";
import { Box, Button, Input, Text } from "@/components/atoms";
import { cn } from "@/utils/className";
import type { ChangeEvent, KeyboardEvent } from "react";
import { useState } from "react";
import { InvProduct, stockOf, matchesLocation } from "@/utils";
import { Thumb } from "@/components/Thumb";
import { IconPlus, IconMap, IconHelp, IconFolder } from "@/components/Icon";
export function RackMap({ groups, q, unassigned, onGoAssign, createRack, onOpen, onMed, }: RackMapProps) {
    const t = q.trim().toLowerCase();
    const [nr, setNr] = useState("");
    const matchProd = (p: InvProduct) => !t ||
        `${p.name} ${p.composition} ${p.manufacturer}`.toLowerCase().includes(t) ||
        matchesLocation(p, t);
    const shown = groups
        .map((g) => ({ ...g, items: g.items.filter(matchProd) }))
        .filter((g) => (!t ? true : g.items.length > 0 || g.code.toLowerCase().includes(t)));
    const submitNew = async () => {
        if (nr.trim() && (await createRack(nr)))
            setNr("");
    };
    return (<>
      {/* create a rack manually */}
      <Box className={cn("!flex !flex-col !rounded-md !border !border-line !bg-paper !shadow-sm !flex-1 !p-[18px]", "!mb-3.5 !flex !items-center !gap-3 !flex-wrap")}>
        <Text as="span" className={cn("font-bold", "!text-[13px]")}>
          <IconFolder size={15}/> Create a rack
        </Text>
        <Input data-field="rack" value={nr} onChange={setNrOnChange} onKeyDown={submitNewOnKeyDown} placeholder="e.g. A3-12" className={cn("!font-mono", "!w-[130px]")}/>
        <Button className="!border-transparent !bg-mid !text-white !shadow-sm hover:!bg-green !h-auto !rounded-xs !px-[11px] !py-1.5 !text-xs" disabled={!nr.trim()} onClick={submitNew}>
          <IconPlus size={14}/> Add rack
        </Button>
        <Text className={cn("!text-muted", "!text-[11.5px] !flex-[1_1_100%] !leading-[1.5]")} as="span">
          Make the on-screen code identical to the printed shelf label. Click any rack below to add
          / arrange medicines inside it.
        </Text>
      </Box>

      {unassigned.length > 0 && !t && (<Box className={cn("!flex !flex-col !rounded-md !border !border-line !bg-paper !shadow-sm !flex-1 !p-[18px]", "!bg-amber-bg !mb-3.5 !flex !items-center !gap-3")}>
          <Text className={cn("!text-[22px]")} as="span">
            <IconHelp size={22}/>
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
          <Button className="!border-transparent !bg-mid !text-white !shadow-sm hover:!bg-green !h-auto !rounded-xs !px-[11px] !py-1.5 !text-xs" onClick={onGoAssign}>
            Assign now →
          </Button>
        </Box>)}

      {shown.length === 0 ? (<Box className="!flex !flex-col !rounded-md !border !border-line !bg-paper !shadow-sm">
          <Box className="!px-5 !py-9 !text-center !text-muted [&_h3]:!mb-[5px] [&_h3]:!text-[15px] [&_h3]:!font-bold [&_h3]:!text-ink">
            <Box className="grid h-[30px] w-[30px] shrink-0 place-items-center overflow-hidden rounded-[7px] bg-wash text-base text-mid">
              <IconMap size={28}/>
            </Box>
            <Text>{q ? `No locations match “${q}”.` : "No racks yet — create one above."}</Text>
          </Box>
        </Box>) : (<Box className="!grid !grid-cols-[repeat(auto-fill,minmax(280px,1fr))] !items-start !gap-3.5">
          {shown.map(renderShown)}
        </Box>)}
    </>);
    function setNrOnChange(e: ChangeEvent<HTMLInputElement>) {
        return setNr(e.target.value.toUpperCase());
    }
    function submitNewOnKeyDown(e: KeyboardEvent<HTMLInputElement>) {
        if (e.key === "Enter")
            void submitNew();
    }
    function renderShown(g: {
        items: InvProduct[];
        code: string;
        zone: string;
    }) {
        return (<Box className="!overflow-hidden !rounded-md !border !border-line !bg-paper !transition hover:!border-line-2 hover:!shadow-[0_6px_18px_rgba(27,61,41,0.07)]" key={g.code}>
              <Button className="!flex !items-center !justify-between !border-b !border-line !px-3 !py-2.5" onClick={onOpenOnClick} title={`Manage rack ${g.code}`}>
                <Text className="font-mono text-base font-extrabold tracking-[0.04em] text-dark" as="span">{g.code}</Text>
                <Text className={cn("!text-muted", "!text-[11.5px]")} as="span">
                  {g.items.length} item{g.items.length !== 1 ? "s" : ""} · manage ›
                </Text>
              </Button>
              <Box className="!flex !flex-col flex max-h-[210px] flex-col overflow-y-auto">
                {g.items.map(renderItem)}
                {g.items.length === 0 && (<Button onClick={onOpenOnClick2} className={cn("!flex !items-center !justify-between !gap-2 !border-b !border-line !py-2 !text-muted w-full cursor-pointer border-0 bg-transparent text-left text-inherit hover:bg-wash-2", "!text-[12px] !justify-center")}>
                    Empty — click to add medicines
                  </Button>)}
              </Box>
            </Box>);
        function onOpenOnClick() {
            return onOpen(g.code);
        }
        function renderItem(p: InvProduct) {
            return (<Button className="!flex !items-center !justify-between !gap-2 !border-b !border-line !py-2 w-full cursor-pointer border-0 bg-transparent text-left text-inherit hover:bg-wash-2" key={p.id} onClick={onMedOnClick} title="View medicine details">
                    <Text className="grid h-[30px] w-[30px] shrink-0 place-items-center overflow-hidden rounded-[7px] bg-wash text-base text-mid" as="span">
                      <Thumb p={p}/>
                    </Text>
                    <Text className="!font-bold !text-ink" as="span">
                      {p.name}
                      <Text className={cn("!text-muted", "!text-[11px]")} as="span">
                        {" "}
                        · {p.composition}
                      </Text>
                    </Text>
                    <Text className={`!inline-flex !items-center !gap-1 !whitespace-nowrap !rounded-full !px-[9px] !py-[3px] !text-[11px] !font-bold ${stockOf(p) === 0 ?"!bg-rose-bg !text-rose" :"!bg-gray-pill !text-muted"}`} as="span">
                      {stockOf(p)} in stock
                    </Text>
                  </Button>);
            function onMedOnClick() {
                return onMed(p.id);
            }
        }
        function onOpenOnClick2() {
            return onOpen(g.code);
        }
    }
}
