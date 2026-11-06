import type { WardSetupModalProps } from "./WardSetupModal.types";
import {
  Box,
  Button,
  Heading,
  Input,
  Label,
  Select,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeaderCell,
  TableRow,
  Text,
} from "@/components/atoms";
import { cn } from "@/utils/className";
import type { ChangeEvent, MouseEvent } from "react";
import { useState } from "react";
import { addWard, updateWard } from "@/store/thunks/hospital.thunk";
import { useAppSelector, useConfirmedDispatch } from "@/hooks";
import { Ward, WardType, WARD_TYPES } from "@/utils/calculations/hospital";
import { IconPlus, IconX } from "@/components/atoms";
export function WardSetupModal({ onClose }: WardSetupModalProps) {
  const confirm = useConfirmedDispatch();
  const wards = useAppSelector((state) => state.hospital.wards);
  const [draft, setDraft] = useState<Omit<Ward, "id">>({
    name: "",
    code: "",
    floor: "",
    type: "General",
    beds: 10,
    occupied: 0,
    sister: "",
  });
  const setD = (p: Partial<Ward>) => setDraft((s) => ({ ...s, ...p }));
  const add = async () => {
    if (!draft.name.trim() || !draft.code.trim()) return;
    const result = await confirm(addWard(draft));
    if ("data" in result)
      setDraft({
        name: "",
        code: "",
        floor: "",
        type: "General",
        beds: 10,
        occupied: 0,
        sister: "",
      });
  };
  return (
    <Box
      className="!fixed !inset-0 !z-[100] !flex !items-center !justify-center !bg-[rgba(13,32,21,0.5)] !p-6 !backdrop-blur-[3px] animate-[pd-fade_0.16s_ease] motion-reduce:animate-none max-[767px]:!items-end max-[767px]:!p-0"
      onClick={onClose}
    >
      <Box
        className="!flex !max-h-[90vh] !w-full !max-w-[720px] !flex-col !overflow-hidden !rounded-lg !bg-paper !shadow-pop animate-[pd-pop_0.2s_cubic-bezier(0.2,0.9,0.3,1.2)] motion-reduce:animate-none max-[767px]:!max-h-[92dvh] max-[767px]:!max-w-none max-[767px]:!rounded-t-2xl max-[767px]:!rounded-b-none"
        onClick={stopPropagationOnClick}
      >
        <Box className="!flex !items-center !justify-between !border-b !border-line !px-5 !py-4 [&_h3]:!text-[17px]">
          <Heading level={3}>Manage wards & beds</Heading>
          <Button
            className="!grid !h-8 !w-8 !place-items-center !rounded-xs !border !border-line-2 !bg-paper !text-ink-2 hover:!bg-wash-2 hover:!text-mid !p-0 !shadow-none"
            onClick={onClose}
          >
            <IconX size={18} />
          </Button>
        </Box>
        <Box className="!overflow-y-auto !p-5">
          <Box className="!overflow-x-auto">
            <Table className="!w-full !border-separate !border-spacing-0 !text-[13px] [&_th]:!sticky [&_th]:!top-0 [&_th]:!border-b [&_th]:!border-line [&_th]:!bg-wash-2 [&_th]:!px-3.5 [&_th]:!py-[11px] [&_th]:!text-left [&_th]:!text-[10.5px] [&_th]:!font-bold [&_th]:!uppercase [&_th]:!tracking-[0.07em] [&_th]:!whitespace-nowrap [&_th]:!text-muted [&_td]:!border-b [&_td]:!border-line [&_td]:!px-3.5 [&_td]:!py-[11px] [&_td]:!align-middle [&_td]:!text-ink-2 [&_tr]:!border-0 [&_tbody_tr:hover]:!bg-wash-2 [&_tbody_tr:last-child_td]:!border-b-0">
              <TableHead>
                <TableRow>
                  <TableHeaderCell>Ward name</TableHeaderCell>
                  <TableHeaderCell>Code</TableHeaderCell>
                  <TableHeaderCell>Floor</TableHeaderCell>
                  <TableHeaderCell>Category</TableHeaderCell>
                  <TableHeaderCell>Beds</TableHeaderCell>
                  <TableHeaderCell>Nurse in-charge</TableHeaderCell>
                  <TableHeaderCell></TableHeaderCell>
                </TableRow>
              </TableHead>
              <TableBody>{wards.map(renderWard)}</TableBody>
            </Table>
          </Box>

          <Box
            className={cn(
              "!flex !flex-col !rounded-md !border !border-line !bg-paper !shadow-sm !flex-1 !p-[18px]",
              "!mt-4 !bg-wash-2",
            )}
          >
            <Text as="span" className={cn("font-bold", "!block !mb-2.5")}>
              Add a ward
            </Text>
            <Box className="!grid !grid-cols-2 !gap-3.5 max-[767px]:!grid-cols-1">
              <Box
                className="!flex !flex-col !gap-1.5 [&_label]:!text-[11.5px] [&_label]:!font-bold [&_label]:!tracking-wide [&_label]:!text-ink-2 !col-span-2 max-[767px]:!col-span-1"
                data-field="name"
              >
                <Label>Ward name</Label>
                <Input
                  className=""
                  value={draft.name}
                  onChange={setDOnChange}
                  placeholder="e.g. Orthopaedic Ward"
                />
              </Box>
              <Box className="!flex !flex-col !gap-1.5 [&_label]:!text-[11.5px] [&_label]:!font-bold [&_label]:!tracking-wide [&_label]:!text-ink-2">
                <Label>Code / bed prefix</Label>
                <Input
                  className="!font-mono"
                  value={draft.code}
                  onChange={setDOnChange2}
                  placeholder="ORT"
                />
              </Box>
              <Box className="!flex !flex-col !gap-1.5 [&_label]:!text-[11.5px] [&_label]:!font-bold [&_label]:!tracking-wide [&_label]:!text-ink-2">
                <Label>Floor</Label>
                <Input
                  className=""
                  value={draft.floor}
                  onChange={setDOnChange3}
                  placeholder="3rd floor"
                />
              </Box>
              <Box className="!flex !flex-col !gap-1.5 [&_label]:!text-[11.5px] [&_label]:!font-bold [&_label]:!tracking-wide [&_label]:!text-ink-2">
                <Label>Category</Label>
                <Select
                  className=""
                  value={draft.type}
                  onChange={setDOnChange4}
                  options={[...WARD_TYPES.map(renderWARDTYPES2)]}
                />
              </Box>
              <Box className="!flex !flex-col !gap-1.5 [&_label]:!text-[11.5px] [&_label]:!font-bold [&_label]:!tracking-wide [&_label]:!text-ink-2">
                <Label>Bed capacity</Label>
                <Input
                  className=""
                  type="number"
                  min={1}
                  value={draft.beds || ""}
                  onChange={setDOnChange5}
                />
              </Box>
              <Box className="!flex !flex-col !gap-1.5 [&_label]:!text-[11.5px] [&_label]:!font-bold [&_label]:!tracking-wide [&_label]:!text-ink-2 !col-span-2 max-[767px]:!col-span-1">
                <Label>Nurse in-charge</Label>
                <Input
                  className=""
                  value={draft.sister}
                  onChange={setDOnChange6}
                  placeholder="Sr. …"
                />
              </Box>
            </Box>
            <Button
              disabled={!draft.name.trim() || !draft.code.trim()}
              onClick={add}
              className={cn("!bg-mid !text-white !shadow-sm hover:!bg-green", "!mt-3")}
            >
              <IconPlus size={15} /> Add ward · {draft.beds} beds ({draft.code}-1…{draft.code}-
              {draft.beds})
            </Button>
          </Box>
        </Box>
        <Box className="!mt-auto !flex !justify-end !gap-2.5 !border-t !border-line !px-5 !py-3.5 max-[767px]:!flex-wrap max-[767px]:[&_button]:!flex-1">
          <Box className="!flex-1" />
          <Button className="!bg-mid !text-white !shadow-sm hover:!bg-green" onClick={onClose}>
            Done
          </Button>
        </Box>
      </Box>
    </Box>
  );
  function stopPropagationOnClick(e: MouseEvent<HTMLDivElement>) {
    return e.stopPropagation();
  }
  function renderWard(w: Ward) {
    return (
      <TableRow key={w.id}>
        <TableCell>
          <Input className="" value={w.name} onChange={updateWardOnChange} />
        </TableCell>
        <TableCell>
          <Input
            value={w.code}
            onChange={updateWardOnChange2}
            className={cn("!font-mono", "!w-[90px]")}
          />
        </TableCell>
        <TableCell>
          <Input value={w.floor} onChange={updateWardOnChange3} className={cn("", "!w-[110px]")} />
        </TableCell>
        <TableCell>
          <Select
            className=""
            value={w.type}
            onChange={updateWardOnChange4}
            options={[...WARD_TYPES.map(renderWARDTYPES)]}
          />
        </TableCell>
        <TableCell>
          <Input
            type="number"
            min={0}
            value={w.beds}
            onChange={updateWardOnChange5}
            className={cn("", "!w-[70px]")}
          />
        </TableCell>
        <TableCell>
          <Input className="" value={w.sister} onChange={updateWardOnChange6} />
        </TableCell>
        <TableCell />
      </TableRow>
    );
    function updateWardOnChange(e: ChangeEvent<HTMLInputElement>) {
      void confirm(updateWard({ id: w.id, patch: { name: e.target.value } }), { kind: "edit" });
    }
    function updateWardOnChange2(e: ChangeEvent<HTMLInputElement>) {
      void confirm(updateWard({ id: w.id, patch: { code: e.target.value.toUpperCase() } }), {
        kind: "edit",
      });
    }
    function updateWardOnChange3(e: ChangeEvent<HTMLInputElement>) {
      void confirm(updateWard({ id: w.id, patch: { floor: e.target.value } }), { kind: "edit" });
    }
    function updateWardOnChange4(e: ChangeEvent<HTMLSelectElement>) {
      void confirm(updateWard({ id: w.id, patch: { type: e.target.value as WardType } }), {
        kind: "edit",
      });
    }
    function renderWARDTYPES(t: WardType) {
      return { value: String(t), label: String(t) };
    }
    function updateWardOnChange5(e: ChangeEvent<HTMLInputElement>) {
      void confirm(
        updateWard({ id: w.id, patch: { beds: Math.max(0, Number(e.target.value) || 0) } }),
        { kind: "edit" },
      );
    }
    function updateWardOnChange6(e: ChangeEvent<HTMLInputElement>) {
      void confirm(updateWard({ id: w.id, patch: { sister: e.target.value } }), { kind: "edit" });
    }
  }
  function setDOnChange(e: ChangeEvent<HTMLInputElement>) {
    return setD({ name: e.target.value });
  }
  function setDOnChange2(e: ChangeEvent<HTMLInputElement>) {
    return setD({ code: e.target.value.toUpperCase() });
  }
  function setDOnChange3(e: ChangeEvent<HTMLInputElement>) {
    return setD({ floor: e.target.value });
  }
  function setDOnChange4(e: ChangeEvent<HTMLSelectElement>) {
    return setD({ type: e.target.value as WardType });
  }
  function renderWARDTYPES2(t: WardType) {
    return { value: String(t), label: String(t) };
  }
  function setDOnChange5(e: ChangeEvent<HTMLInputElement>) {
    return setD({ beds: Math.max(0, Number(e.target.value) || 0) });
  }
  function setDOnChange6(e: ChangeEvent<HTMLInputElement>) {
    return setD({ sister: e.target.value });
  }
}
