import type { InvProduct } from "@/utils";
import {
  Box,
  Heading,
  Input,
  Label,
  Switch,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeaderCell,
  TableRow,
  Text,
} from "@/components/atoms";
import { cn } from "@/utils/className";
import {
  dataTableClass,
  numClass,
  statCardClass,
  statIconClass,
  statLabelClass,
  statSplitClass,
  statValueClass,
  tableLastRowClass,
  toolbarControlClass,
} from "@/screens/Purchases/purchaseChrome";
import type { ChangeEvent } from "react";
import { useMemo, useState } from "react";
import { useAppSelector } from "@/hooks";
import { SupplyEntry, inr2, effectiveSupplyPrice, schemeLabel, isDevice } from "@/utils";
import { IconStar, IconScale, IconCash, IconTag, IconCheck } from "@/components/atoms";
import { Thumb } from "@/components/molecules";
import { multiSourceCount } from "@/screens/Purchases/utils/multiSourceCount";
export function PriceCompare() {
  const supplyList = useAppSelector((state) => state.purchases.supplyList);
  const suppliers = useAppSelector((state) => state.purchases.suppliers);
  const inventory = useAppSelector((state) => state.inventory.inventory);
  const [searchQuery, setSearchQuery] = useState("");
  const [onlyMulti, setOnlyMulti] = useState(true);
  const prodOf = (id: string) => inventory.find((p) => p.id === id);
  const supOf = (id: string) => suppliers.find((s) => s.id === id);
  // group supply rows by product
  const groups = useMemo(() => {
    const m: Record<string, SupplyEntry[]> = {};
    supplyList.forEach((e) => {
      (m[e.productId] ||= []).push(e);
    });
    return Object.entries(m)
      .map(([pid, rows]) => ({
        p: prodOf(pid),
        rows: rows
          .slice()
          .sort((left, right) => effectiveSupplyPrice(left) - effectiveSupplyPrice(right)),
      }))
      .filter((g) => g.p)
      .filter((g) => !onlyMulti || g.rows.length > 1)
      .filter(
        (g) =>
          !searchQuery.trim() ||
          g.p!.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          g.p!.composition.toLowerCase().includes(searchQuery.toLowerCase()),
      )
      .sort((left, right) => left.p!.name.localeCompare(right.p!.name));
  }, [supplyList, inventory, onlyMulti, searchQuery]);
  const totalSaving = groups.reduce((sum, g) => {
    if (g.rows.length < 2) return sum;
    return (
      sum + (effectiveSupplyPrice(g.rows[g.rows.length - 1]) - effectiveSupplyPrice(g.rows[0]))
    );
  }, 0);
  return (
    <>
      <Box className="!mb-[22px] !grid !grid-cols-[repeat(auto-fit,minmax(min(100%,168px),1fr))] !gap-4">
        <Box className={statCardClass}>
          <Box className={cn(statIconClass, "!bg-blue-bg !text-blue")}>
            <IconScale size={18} />
          </Box>
          <Box className={statLabelClass}>Comparable items</Box>
          <Box className={statValueClass}>{multiSourceCount(supplyList)}</Box>
          <Box className={statSplitClass}>supplied by 2+ distributors</Box>
        </Box>
        <Box className={statCardClass}>
          <Box className={cn(statIconClass, "!bg-wash !text-mid")}>
            <IconCash size={18} />
          </Box>
          <Box className={statLabelClass}>Saving per pack</Box>
          <Box className={statValueClass}>{inr2(totalSaving)}</Box>
          <Box className={statSplitClass}>buying each at its lowest</Box>
        </Box>
        <Box className={statCardClass}>
          <Box className={cn(statIconClass, "!bg-amber-bg !text-gold-d")}>
            <IconTag size={18} />
          </Box>
          <Box className={statLabelClass}>Distributors compared</Box>
          <Box className={statValueClass}>{suppliers.length}</Box>
          <Box className={statSplitClass}>across your supply list</Box>
        </Box>
      </Box>

      <Box className="!mb-4 !flex !flex-wrap !items-center !gap-2.5">
        <Heading className={cn("!text-[16px]")} level={2}>
          Purchase-price comparison
        </Heading>
        <Box className="!flex-1" />
        <Label
          className={cn(
            "!flex !items-center !gap-2.5",
            "!gap-2 !items-center !text-[12.5px] !font-semibold",
          )}
        >
          <Switch
            checked={onlyMulti}
            label="Toggle"
            onClick={setOnlyMultiOnClick}
            className="!transition-[background-color] !duration-[160ms] after:!bg-white after:!shadow-[0_1px_3px_rgba(0,0,0,0.22)] after:!transition-transform after:!duration-[160ms] after:!ease-[cubic-bezier(0.3,0.7,0.4,1)]"
          />
          Only multi-source
        </Label>
        <Input
          placeholder="Search medicine…"
          value={searchQuery}
          onChange={setSearchQueryOnChange}
          className={cn(toolbarControlClass, "!max-w-[220px]")}
        />
      </Box>

      <Box className="!flex !flex-col !rounded-md !border !border-line !bg-paper !shadow-sm">
        <Box className="!overflow-x-auto">
          <Table className={cn(dataTableClass, tableLastRowClass)}>
            <TableHead>
              <TableRow>
                <TableHeaderCell>Medicine / device</TableHeaderCell>
                <TableHeaderCell>Quotes from distributors (low → high)</TableHeaderCell>
                <TableHeaderCell className={numClass}>Best ₹</TableHeaderCell>
                <TableHeaderCell className={numClass}>Saving / pack</TableHeaderCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {groups.map(renderGroup)}
              {groups.length === 0 && (
                <TableRow>
                  <TableCell colSpan={4}>
                    <Box className="!p-7 !text-center !text-muted">
                      <Box className="mx-auto mb-3 grid h-11 w-11 place-items-center rounded-xl bg-wash text-[21px] leading-none text-mid">
                        <IconScale size={30} />
                      </Box>
                      <Text className="!text-[13px] !text-muted">
                        {onlyMulti
                          ? "No medicine is sourced from 2+ distributors yet. Add the same item under different distributors in the Supply list to compare prices."
                          : "No supply items to compare."}
                      </Text>
                    </Box>
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </Box>
      </Box>
    </>
  );
  function setOnlyMultiOnClick() {
    return setOnlyMulti((v) => !v);
  }
  function setSearchQueryOnChange(e: ChangeEvent<HTMLInputElement>) {
    return setSearchQuery(e.target.value);
  }
  function renderGroup(g: { p: InvProduct | undefined; rows: SupplyEntry[] }) {
    const p = g.p!;
    const low = g.rows[0];
    const high = g.rows[g.rows.length - 1];
    const saving = g.rows.length > 1 ? effectiveSupplyPrice(high) - effectiveSupplyPrice(low) : 0;
    return (
      <TableRow key={p.id}>
        <TableCell>
          <Box className="flex items-center gap-2.5">
            <Text
              className="inline-grid h-[34px] w-[34px] shrink-0 place-items-center overflow-hidden rounded-[9px] bg-wash text-[17px] font-display font-bold leading-none text-mid"
              as="span"
            >
              <Thumb p={p} />
            </Text>
            <Text as="span">
              <Text className="!text-[13px] !font-bold !text-ink" as="span">
                {p.name}
              </Text>
              <Box className="text-[11.5px] text-muted">
                {isDevice(p) ? "Device · " : ""}
                {p.pack}
              </Box>
            </Text>
          </Box>
        </TableCell>
        <TableCell>
          <Box className={cn("!flex !items-center !gap-2.5", "!flex-wrap !gap-1.5")}>
            {g.rows.map(renderRow)}
          </Box>
        </TableCell>
        <TableCell className={cn(numClass, "!font-bold !text-[#1f7a46]")}>
          {inr2(effectiveSupplyPrice(low))}
        </TableCell>
        <TableCell
          className={cn(numClass, "!font-bold", saving > 0 ? "!text-[#1f7a46]" : "!text-mid")}
        >
          {saving > 0 ? inr2(saving) : "—"}
        </TableCell>
      </TableRow>
    );
    function renderRow(r: SupplyEntry, i: number) {
      return (
        <Text
          key={r.id}
          title={
            schemeLabel(r)
              ? `${inr2(r.purchasePrice)} list, ${schemeLabel(r)} scheme`
              : i === 0
                ? "Lowest landed price"
                : undefined
          }
          className={cn(
            `!inline-flex !items-center !gap-1 !whitespace-nowrap !rounded-full !px-[9px] !py-[3px] !text-[11px] !font-bold ${i === 0 ? "!bg-wash !text-mid" : "!bg-gray-pill !text-muted"}`,
            "!gap-[5px]",
          )}
          as="span"
        >
          {r.preferred && (
            <>
              <IconStar size={12} />{" "}
            </>
          )}
          {supOf(r.supplierId)?.name ?? "—"} · {inr2(effectiveSupplyPrice(r))}
          {schemeLabel(r) ? ` (${schemeLabel(r)})` : ""}
          {i === 0 && g.rows.length > 1 ? (
            <>
              {" "}
              <IconCheck size={12} />
            </>
          ) : (
            ""
          )}
        </Text>
      );
    }
  }
}
