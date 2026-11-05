import type { ChangeEvent, ReactNode } from "react";
import { Box } from "@/components/atoms/Box";
import { Button } from "@/components/atoms/Button";
import { Input } from "@/components/atoms/Input";
import { Stack } from "@/components/atoms/Stack";
import { IconBolt, IconCash, IconGlobe, IconSearch, IconStore } from "@/components/atoms/Icon";
import { cn } from "@/utils/className";
import type { OrderFilter } from "../../Orders.types";
import type { OrderFiltersProps } from "./OrderFilters.types";

const FILTERS: OrderFilter[] = ["all", "online", "offline", "action", "unpaid"];

export function OrderFilters({
  filter,
  counts,
  searchQuery,
  onFilter,
  onSearch,
}: OrderFiltersProps) {
  function renderFilter(key: OrderFilter) {
    return (
      <FilterButton
        key={key}
        filterKey={key}
        selected={filter === key}
        count={counts[key]}
        onFilter={onFilter}
      />
    );
  }
  function changeSearch(event: ChangeEvent<HTMLInputElement>) {
    onSearch(event.target.value);
  }
  return (
    <Stack direction="row" align="center" wrap className="mb-4 gap-2.5">
      <Box className="inline-flex max-w-full flex-wrap gap-0.5 rounded-sm border border-line bg-wash-2 p-0.5">
        {FILTERS.map(renderFilter)}
      </Box>
      <Box className="flex-1" />
      <Stack
        direction="row"
        align="center"
        className="max-w-[360px] min-w-[240px] flex-1 gap-2 rounded-sm border border-line-2 bg-paper px-3 py-2 max-md:max-w-none max-md:min-w-0 max-md:basis-full"
      >
        <Box className="text-green">
          <IconSearch size={17} />
        </Box>
        <Input
          variant="plain"
          placeholder="Search invoice, customer, phone…"
          value={searchQuery}
          onChange={changeSearch}
          className="min-w-0 flex-1 py-0 text-[13.5px] text-ink placeholder:text-faint"
        />
      </Stack>
    </Stack>
  );
}

function FilterButton({
  filterKey,
  selected,
  count,
  onFilter,
}: {
  filterKey: OrderFilter;
  selected: boolean;
  count: number;
  onFilter: (filter: OrderFilter) => void;
}) {
  function select() {
    onFilter(filterKey);
  }
  return (
    <Button
      variant="ghost"
      size="sm"
      onClick={select}
      className={cn(
        "h-auto items-baseline gap-0 border-0 px-[13px] py-1.5 text-[12.5px] !leading-[1.5] shadow-none",
        selected
          ? "bg-paper text-dark shadow-sm hover:bg-paper hover:text-dark"
          : "bg-transparent text-muted hover:bg-transparent hover:text-muted",
      )}
    >
      <FilterLabel filterKey={filterKey} /> ({count})
    </Button>
  );
}

function FilterLabel({ filterKey }: { filterKey: OrderFilter }) {
  if (filterKey === "all") return "All";
  return (
    <>
      <FilterIcon filterKey={filterKey} /> {filterCopy(filterKey)}
    </>
  );
}

function FilterIcon({ filterKey }: { filterKey: OrderFilter }) {
  const icon: Record<Exclude<OrderFilter, "all">, ReactNode> = {
    online: <IconGlobe size={13} />,
    offline: <IconStore size={13} />,
    action: <IconBolt size={13} />,
    unpaid: <IconCash size={13} />,
  };
  if (filterKey === "all") return null;
  return icon[filterKey];
}

function filterCopy(filterKey: OrderFilter) {
  if (filterKey === "online") return "Online";
  if (filterKey === "offline") return "Counter";
  if (filterKey === "action") return "Needs action";
  return "Unpaid";
}
