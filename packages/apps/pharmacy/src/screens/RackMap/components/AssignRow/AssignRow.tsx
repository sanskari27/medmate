import type { AssignRowProps } from "./AssignRow.types";
import { Box, Button, Input, TableCell, TableRow, Text } from "@/components/atoms";
import { cn } from "@/utils/className";
import type { ChangeEvent } from "react";
import { useState } from "react";
import { stockOf, hasLocation, locationCodes } from "@/utils";
import { Thumb } from "@/components/molecules";
export function AssignRow({ p, checked, onToggle, onSave, fillCode }: AssignRowProps) {
  const [val, setVal] = useState(p.rack || "");
  const dirty = val.trim() !== (p.rack || "").trim();
  return (
    <TableRow>
      <TableCell>
        <Input
          type="checkbox"
          checked={checked}
          onChange={onToggle}
          aria-label={`Select ${p.name}`}
          className="!h-4 !w-4 !shrink-0 !cursor-pointer !rounded-[3px] !p-0 accent-mid"
        />
      </TableCell>
      <TableCell>
        <Box className="flex items-center gap-2.5">
          <Text
            className="grid h-[34px] w-[34px] shrink-0 place-items-center overflow-hidden rounded-[9px] bg-wash text-[17px] leading-none text-mid"
            as="span"
          >
            <Thumb p={p} />
          </Text>
          <Text as="span">
            <Text className="!text-[13px] !font-bold !text-ink" as="span">
              {p.name}
            </Text>
            <Box className="text-[11.5px] text-muted">{p.composition}</Box>
          </Text>
        </Box>
      </TableCell>
      <TableCell>
        <Text
          className={`!inline-flex !items-center !gap-1 !whitespace-nowrap !rounded-full !px-[9px] !py-[3px] !text-[11px] !font-bold ${stockOf(p) === 0 ? "!bg-rose-bg !text-rose" : "!bg-gray-pill !text-muted"}`}
          as="span"
        >
          {stockOf(p)}
        </Text>
      </TableCell>
      <TableCell className="!font-mono">
        {hasLocation(p) ? (
          locationCodes(p).join(" · ")
        ) : (
          <Text className="!text-muted" as="span">
            —
          </Text>
        )}
      </TableCell>
      <TableCell>
        <Box className="!flex !items-center !gap-1.5">
          <Input
            data-field="rack"
            value={val}
            onChange={setValOnChange}
            placeholder={fillCode || "A3-12"}
            className={cn("!font-mono", "!w-[96px]")}
          />
          {fillCode && val.trim() !== fillCode && (
            <Button
              className="!grid !h-8 !w-8 !place-items-center !rounded-xs !border !border-line-2 !bg-paper !p-0 !text-ink-2 !shadow-none hover:!bg-wash-2 hover:!text-mid active:!translate-y-0"
              title={`Use ${fillCode}`}
              onClick={setValOnClick}
            >
              ↤
            </Button>
          )}
          <Button
            className="!h-auto !rounded-xs !px-[11px] !py-1.5 !text-xs !border-transparent !bg-mid !text-white !shadow-sm hover:!bg-green"
            disabled={!dirty || !val.trim()}
            onClick={onSaveOnClick}
          >
            Save
          </Button>
        </Box>
      </TableCell>
    </TableRow>
  );
  function setValOnChange(e: ChangeEvent<HTMLInputElement>) {
    return setVal(e.target.value.toUpperCase());
  }
  function setValOnClick() {
    return setVal(fillCode);
  }
  function onSaveOnClick() {
    return onSave(val.trim());
  }
}
