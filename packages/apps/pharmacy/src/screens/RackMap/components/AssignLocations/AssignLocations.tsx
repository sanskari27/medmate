import type { AssignLocationsProps } from "./AssignLocations.types";
import { Box, Button, Input, Label, Table, TableBody, TableCell, TableHead, TableHeaderCell, TableRow, Text } from "@/components/atoms";
import { cn } from "@/utils/className";
import type { ChangeEvent } from "react";
import { useState } from "react";
import { InvProduct, hasLocation, composeRack, matchesLocation } from "@/utils";
import { IconCheck } from "@/components/Icon";
import { AssignRow } from "@/screens/RackMap/components/AssignRow";
export function AssignLocations({ inventory, q, setProductLocation, bulkAssignLocation, toast, }: AssignLocationsProps) {
    const [onlyUnset, setOnlyUnset] = useState(true);
    const [sel, setSel] = useState<Set<string>>(new Set());
    const [rack, setRack] = useState("");
    const [shelf, setShelf] = useState("");
    const [bin, setBin] = useState("");
    const code = composeRack(rack, shelf, bin);
    const t = q.trim().toLowerCase();
    const list = inventory.filter((p) => {
        if (onlyUnset && hasLocation(p))
            return false;
        if (t &&
            !(`${p.name} ${p.composition} ${p.manufacturer}`.toLowerCase().includes(t) ||
                matchesLocation(p, t)))
            return false;
        return true;
    });
    const toggle = (id: string) => setSel((s) => {
        const n = new Set(s);
        if (n.has(id))
            n.delete(id);
        else
            n.add(id);
        return n;
    });
    const allShownSelected = list.length > 0 && list.every((p) => sel.has(p.id));
    const toggleAll = () => setSel((s) => {
        const n = new Set(s);
        if (allShownSelected)
            list.forEach((p) => n.delete(p.id));
        else
            list.forEach((p) => n.add(p.id));
        return n;
    });
    const assignSelected = async () => {
        if (!code || sel.size === 0)
            return;
        if (await bulkAssignLocation([...sel], code))
            return;
        toast(`${sel.size} medicine ${sel.size !== 1 ? " s" : ""} → ${code}`);
        setSel(new Set());
    };
    return (<Box className="!grid !gap-3">
      {/* location builder */}
      <Box className={cn("!flex !flex-col !rounded-md !border !border-line !bg-paper !shadow-sm !flex-1 !p-[18px]", "!mb-3.5")}>
        <Box className={cn("!flex !items-center !gap-2.5", "!gap-4 !flex-wrap !items-end")}>
          <Box data-field="rack" className={cn("!flex !flex-col !gap-1.5 [&_label]:!text-[11.5px] [&_label]:!font-bold [&_label]:!tracking-wide [&_label]:!text-ink-2", "!w-[90px]")}>
            <Label>Rack</Label>
            <Input className="" value={rack} onChange={setRackOnChange} placeholder="A" maxLength={4}/>
          </Box>
          <Box className={cn("!flex !flex-col !gap-1.5 [&_label]:!text-[11.5px] [&_label]:!font-bold [&_label]:!tracking-wide [&_label]:!text-ink-2", "!w-[80px]")}>
            <Label>Shelf</Label>
            <Input className="" value={shelf} onChange={setShelfOnChange} placeholder="3" maxLength={3}/>
          </Box>
          <Box className={cn("!flex !flex-col !gap-1.5 [&_label]:!text-[11.5px] [&_label]:!font-bold [&_label]:!tracking-wide [&_label]:!text-ink-2", "!w-[80px]")}>
            <Label>Bin</Label>
            <Input className="" value={bin} onChange={setBinOnChange} placeholder="12" maxLength={4}/>
          </Box>
          <Box className={cn("!self-stretch !flex !items-end !pb-0.5")}>
            <Box>
              <Box className={cn("!text-muted", "!text-[11px]")}>
                Location code
              </Box>
              <Box className="!rounded-md !border !border-line !bg-wash-2 !p-3">{code || "—"}</Box>
            </Box>
          </Box>
          <Box className="!flex-1"/>
          <Button className="!border-transparent !bg-mid !text-white !shadow-sm hover:!bg-green" disabled={!code || sel.size === 0} onClick={assignSelected}>
            <IconCheck size={16}/> Assign to {sel.size || ""} selected
          </Button>
        </Box>
        <Box className={cn("!text-muted", "!text-[11.5px] !mt-2.5")}>
          Read like an address: <Text as="span" className="font-bold">Rack</Text> (cupboard A, B, C…) → <Text as="span" className="font-bold">Shelf</Text> (top = 1) →{" "}
          <Text as="span" className="font-bold">Bin</Text> (slot left→right). Keep the on-screen code identical to the printed shelf
          label. Tip: keep fast-movers in racks nearest the counter.
        </Box>
      </Box>

      {/* filter row */}
      <Box className={cn("!flex !items-center !gap-2.5", "!justify-between !mb-2")}>
        <Label className={cn("!flex !items-center !gap-1.5", "!cursor-pointer !text-[13px]")}>
          <Input type="checkbox" checked={onlyUnset} onChange={setOnlyUnsetOnChange}/>{" "}
          Show only medicines with no location
        </Label>
        <Text className={cn("!text-muted", "!text-[12.5px]")} as="span">
          {list.length} shown · {sel.size} selected
        </Text>
      </Box>

      <Box className="!flex !flex-col !rounded-md !border !border-line !bg-paper !shadow-sm">
        <Box className="!overflow-x-auto">
          <Table className="!w-full !border-separate !border-spacing-0 !text-[13px] [&_th]:!sticky [&_th]:!top-0 [&_th]:!border-b [&_th]:!border-line [&_th]:!bg-wash-2 [&_th]:!px-3.5 [&_th]:!py-[11px] [&_th]:!text-left [&_th]:!text-[10.5px] [&_th]:!font-bold [&_th]:!uppercase [&_th]:!tracking-[0.07em] [&_th]:!whitespace-nowrap [&_th]:!text-muted [&_td]:!border-b [&_td]:!border-line [&_td]:!px-3.5 [&_td]:!py-[11px] [&_td]:!align-middle [&_td]:!text-ink-2">
            <TableHead>
              <TableRow>
                <TableHeaderCell className={cn("!w-9")}>
                  <Input type="checkbox" checked={allShownSelected} onChange={toggleAll} aria-label="Select all shown"/>
                </TableHeaderCell>
                <TableHeaderCell>Medicine</TableHeaderCell>
                <TableHeaderCell>Stock</TableHeaderCell>
                <TableHeaderCell>Current location</TableHeaderCell>
                <TableHeaderCell className={cn("!w-[200px]")}>Set location</TableHeaderCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {list.map(renderList)}
              {list.length === 0 && (<TableRow>
                  <TableCell colSpan={5}>
                    <Box className="!px-5 !py-9 !text-center !text-muted [&_h3]:!mb-[5px] [&_h3]:!text-[15px] [&_h3]:!font-bold [&_h3]:!text-ink">
                      <Box className="grid h-[30px] w-[30px] shrink-0 place-items-center overflow-hidden rounded-[7px] bg-wash text-base text-mid">
                        <IconCheck size={28}/>
                      </Box>
                      <Text>
                        {onlyUnset
                ? "Every medicine has a location. Nice and tidy!"
                : "No medicines match."}
                      </Text>
                    </Box>
                  </TableCell>
                </TableRow>)}
            </TableBody>
          </Table>
        </Box>
      </Box>
    </Box>);
    function setRackOnChange(e: ChangeEvent<HTMLInputElement>) {
        return setRack(e.target.value.toUpperCase());
    }
    function setShelfOnChange(e: ChangeEvent<HTMLInputElement>) {
        return setShelf(e.target.value);
    }
    function setBinOnChange(e: ChangeEvent<HTMLInputElement>) {
        return setBin(e.target.value);
    }
    function setOnlyUnsetOnChange(e: ChangeEvent<HTMLInputElement>) {
        return setOnlyUnset(e.target.checked);
    }
    function renderList(p: InvProduct) {
        return (<AssignRow key={p.id} p={p} checked={sel.has(p.id)} onToggle={toggleOnToggle} onSave={setProductLocationOnSave} fillCode={code}/>);
        function toggleOnToggle() {
            return toggle(p.id);
        }
        async function setProductLocationOnSave(v: string) {
            if (!(await setProductLocation(p.id, v)))
                toast(`${p.name} → ${v}`);
        }
    }
}
