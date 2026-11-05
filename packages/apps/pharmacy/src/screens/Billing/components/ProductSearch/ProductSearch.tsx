import type { ChangeEvent, KeyboardEvent } from "react";
import { Box } from "@/components/atoms/Box";
import { Button } from "@/components/atoms/Button";
import { Input } from "@/components/atoms/Input";
import { Stack } from "@/components/atoms/Stack";
import { IconCamera, IconSearch } from "@/components/atoms/Icon";
import type { ProductSearchProps } from "./ProductSearch.types";

export function ProductSearch({
  scan,
  searchQuery,
  onScanChange,
  onScanSubmit,
  onSearchChange,
}: ProductSearchProps) {
  function changeScan(event: ChangeEvent<HTMLInputElement>) {
    onScanChange(event.target.value);
  }
  function changeSearch(event: ChangeEvent<HTMLInputElement>) {
    onSearchChange(event.target.value);
  }
  function submitOnEnter(event: KeyboardEvent<HTMLInputElement>) {
    if (event.key !== "Enter") return;
    event.preventDefault();
    onScanSubmit();
  }

  return (
    <Stack direction="row" align="center" wrap className="mb-4 gap-2.5">
      <Stack
        direction="row"
        align="center"
        gap={2}
        className="flex-[1_1_280px] rounded-sm border-[1.5px] border-mid bg-wash-2 py-1 pr-1.5 pl-[11px]"
      >
        <Box className="text-ink">
          <IconCamera size={17} />
        </Box>
        <Input
          variant="plain"
          placeholder="Scan barcode / type batch no. + Enter"
          value={scan}
          onChange={changeScan}
          onKeyDown={submitOnEnter}
          autoFocus
          className="py-1.5 text-[13.5px]"
        />
        <Button variant="primary" size="sm" onClick={onScanSubmit} disabled={!scan.trim()}>
          Add
        </Button>
      </Stack>
      <Stack
        direction="row"
        align="center"
        gap={2}
        className="max-w-[360px] min-w-[240px] flex-1 rounded-sm border border-line-2 bg-paper px-3 py-2 max-[767px]:min-w-0 max-[767px]:max-w-none max-[767px]:flex-[1_1_100%]"
      >
        <Box className="text-green">
          <IconSearch size={17} />
        </Box>
        <Input
          variant="plain"
          placeholder="Search medicine, salt, brand…"
          value={searchQuery}
          onChange={changeSearch}
          className="py-0 text-[13.5px]"
        />
      </Stack>
    </Stack>
  );
}
