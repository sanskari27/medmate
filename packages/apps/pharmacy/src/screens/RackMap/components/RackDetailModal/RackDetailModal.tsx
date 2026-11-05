import type { RackDetailModalProps } from "./RackDetailModal.types";
import { Box, Button, Heading, Input, Label, Text } from "@/components/atoms";
import { cn } from "@/utils/className";
import type { ChangeEvent, MouseEvent } from "react";
import { useState } from "react";
import { InvProduct, stockOf, hasLocation, locationCodes } from "@/utils";
import { Thumb } from "@/components/molecules";
import { IconSearch, IconX, IconFolder, IconBox } from "@/components/atoms";
export function RackDetailModal({ code, items, inventory, onClose, onAdd, onMed, }: RackDetailModalProps) {
    const [pq, setPq] = useState("");
    const t = pq.trim().toLowerCase();
    const here = new Set(items.map((p) => p.id));
    const results = inventory
        .filter((p) => !here.has(p.id) &&
        (!t || `${p.name} ${p.composition} ${p.manufacturer}`.toLowerCase().includes(t)))
        .slice(0, 8);
    return (<Box className="!fixed !inset-0 !z-[100] !flex !items-center !justify-center !bg-[rgba(13,32,21,0.5)] !p-6 !backdrop-blur-[3px]" onClick={onClose}>
      <Box className="!flex !max-h-[90vh] !w-full !max-w-[540px] !flex-col !overflow-hidden !rounded-lg !bg-paper !shadow-pop" onClick={stopPropagationOnClick}>
        <Box className="!flex !items-center !justify-between !border-b !border-line !px-5 !py-4 [&_h3]:!text-[17px]">
          <Heading level={3}>
            <IconFolder size={16}/> Rack <Text className="!font-mono" as="span">{code}</Text>
          </Heading>
          <Button className="!grid !h-8 !w-8 !place-items-center !rounded-sm !border-0 !bg-wash-2 !text-lg !text-ink-2 !shadow-none hover:!bg-wash" onClick={onClose}>
            <IconX size={18}/>
          </Button>
        </Box>
        <Box className="!overflow-y-auto !p-5">
          {/* search + add */}
          <Box className={cn("!flex !flex-col !gap-1.5 [&_label]:!text-[11.5px] [&_label]:!font-bold [&_label]:!tracking-wide [&_label]:!text-ink-2", "!mb-2.5")}>
            <Label>Add medicine to this rack</Label>
            <Box className={cn("!flex !max-w-[360px] !min-w-[240px] !flex-1 !items-center !gap-2 !rounded-sm !border !border-line-2 !bg-paper !px-3 !py-2 [&_input]:!w-full [&_input]:!border-0 [&_input]:!bg-transparent [&_input]:!text-[13.5px] [&_input]:!text-ink [&_input]:!outline-none", "!w-full")}>
              <Text className="!text-green" as="span">
                <IconSearch size={16}/>
              </Text>
              <Input autoFocus placeholder="Search medicine by name, salt, brand…" value={pq} onChange={setPqOnChange}/>
            </Box>
          </Box>
          {pq.trim() && (<Box className={cn("!rounded-md !border !border-line", "!mb-3.5")}>
              <Box className="!max-h-60 !overflow-auto">
                {results.map(renderResult)}
                {results.length === 0 && (<Box className={cn("!text-muted", "!py-2.5 !px-3 !text-[12.5px]")}>
                    No other medicine matches “{pq}”.
                  </Box>)}
              </Box>
            </Box>)}

          {/* medicines currently in this rack */}
          <Box className={cn("!flex !items-center !gap-2.5", "!justify-between !mb-1.5")}>
            <Text as="span" className={cn("font-bold", "!text-[13px]")}>In this rack</Text>
            <Text className={cn("!text-muted", "!text-[12px]")} as="span">
              {items.length} item{items.length !== 1 ? "s" : ""}
            </Text>
          </Box>
          {items.length === 0 ? (<Box className={cn("!px-5 !py-9 !text-center !text-muted [&_h3]:!mb-[5px] [&_h3]:!text-[15px] [&_h3]:!font-bold [&_h3]:!text-ink", "!py-5 !px-2.5")}>
              <Box className="grid h-[30px] w-[30px] shrink-0 place-items-center overflow-hidden rounded-[7px] bg-wash text-base text-mid">
                <IconBox size={28}/>
              </Box>
              <Text>No medicines here yet. Search above to add some.</Text>
            </Box>) : (<Box className={cn("!flex !flex-col flex max-h-[320px] flex-col overflow-y-auto", "!border !border-line !rounded-md")}>
              {items.map(renderItem)}
            </Box>)}
        </Box>
        <Box className="!mt-auto !flex !justify-end !gap-2.5 !border-t !border-line !px-5 !py-3.5">
          <Box className="!flex-1"/>
          <Button className="!border-transparent !bg-mid !text-white !shadow-sm hover:!bg-green" onClick={onClose}>
            Done
          </Button>
        </Box>
      </Box>
    </Box>);
    function stopPropagationOnClick(e: MouseEvent<HTMLDivElement>) {
        return e.stopPropagation();
    }
    function setPqOnChange(e: ChangeEvent<HTMLInputElement>) {
        return setPq(e.target.value);
    }
    function renderResult(p: InvProduct) {
        return (<Button key={p.id} className="!flex !w-full !items-center !justify-between !border-b !border-line !px-3 !py-2 !text-left hover:!bg-wash-2" onClick={onAddOnClick}>
                    <Text as="span" className="font-bold">{p.name}</Text>
                    <Text className="!text-muted" as="span">
                      {" "}
                      · {p.composition || p.manufacturer} · {stockOf(p)} in stock
                      {hasLocation(p) ? ` · now at ${locationCodes(p).join(" · ")}` : ""}
                    </Text>
                  </Button>);
        function onAddOnClick() {
            return onAdd(p.id);
        }
    }
    function renderItem(p: InvProduct) {
        return (<Box className="!flex !items-center !justify-between !gap-2 !border-b !border-line !py-2" key={p.id}>
                  <Button className="!min-w-0" onClick={onMedOnClick} title="View medicine details">
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
                      {stockOf(p)}
                    </Text>
                  </Button>
                </Box>);
        function onMedOnClick() {
            return onMed(p.id);
        }
    }
}
