import {
  Box,
  Button,
  Heading,
  IconButton,
  Input,
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
import { usePharma } from "@/hooks";
import { Supplier, inr, allottedSupplierId } from "@/utils";
import {
  IconPlus,
  IconEdit,
  IconTruck,
  IconMail,
  IconBox,
  IconCard,
  IconUsers,
  IconPhone,
} from "@/components/atoms";
import { DistributorModal } from "@/screens/Purchases/components/DistributorModal";
export function Directory() {
  const { suppliers, inventory, addSupplier, updateSupplier } = usePharma();
  const [edit, setEdit] = useState<Supplier | null>(null);
  const [adding, setAdding] = useState(false);
  const [q, setQ] = useState("");
  const prodCount = useMemo(() => {
    const m: Record<string, number> = {};
    inventory.forEach((p) => {
      const id = allottedSupplierId(p, suppliers);
      m[id] = (m[id] || 0) + 1;
    });
    return m;
  }, [inventory, suppliers]);
  const totalOutstanding = suppliers.reduce((s, x) => s + (x.outstanding || 0), 0);
  const activeCount = suppliers.filter((s) => s.active !== false).length;
  const filtered = suppliers.filter((s) => {
    if (!q.trim()) return true;
    const t = q.toLowerCase();
    return [s.name, s.gstin, s.phone, s.contactPerson, s.city, s.email]
      .filter(Boolean)
      .some((v) => v!.toLowerCase().includes(t));
  });
  return (
    <>
      <Box className="!mb-[22px] !grid !grid-cols-[repeat(auto-fit,minmax(min(100%,168px),1fr))] !gap-4">
        <Box className={statCardClass}>
          <Box className={cn(statIconClass, "!bg-blue-bg !text-blue")}>
            <IconTruck size={18} />
          </Box>
          <Box className={statLabelClass}>Distributors</Box>
          <Box className={statValueClass}>{suppliers.length}</Box>
          <Box className={statSplitClass}>{activeCount} active</Box>
        </Box>
        <Box className={statCardClass}>
          <Box className={cn(statIconClass, "!bg-wash !text-mid")}>
            <IconBox size={18} />
          </Box>
          <Box className={statLabelClass}>Products sourced</Box>
          <Box className={statValueClass}>{inventory.length}</Box>
          <Box className={statSplitClass}>across all suppliers</Box>
        </Box>
        <Box className={statCardClass}>
          <Box className={cn(statIconClass, "!bg-rose-bg !text-rose")}>
            <IconCard size={18} />
          </Box>
          <Box className={statLabelClass}>Total outstanding</Box>
          <Box className={statValueClass}>{inr(totalOutstanding)}</Box>
          <Box className={statSplitClass}>payable to distributors</Box>
        </Box>
        <Box className={statCardClass}>
          <Box className={cn(statIconClass, "!bg-amber-bg !text-gold-d")}>
            <IconUsers size={18} />
          </Box>
          <Box className={statLabelClass}>On credit terms</Box>
          <Box className={statValueClass}>{suppliers.filter(matchSupplier).length}</Box>
          <Box className={statSplitClass}>credit accounts</Box>
        </Box>
      </Box>

      <Box className="!mb-4 !flex !flex-wrap !items-center !gap-2.5">
        <Heading className={cn("!text-[16px]")} level={2}>
          Distributor directory
        </Heading>
        <Box className="!flex-1" />
        <Input
          placeholder="Search name, GSTIN, contact…"
          value={q}
          onChange={setQOnChange}
          className={cn(toolbarControlClass, "!max-w-[260px]")}
        />
        <Button onClick={setAddingOnClick}>
          <IconPlus size={16} /> Add distributor
        </Button>
      </Box>

      <Box className="!flex !flex-col !rounded-md !border !border-line !bg-paper !shadow-sm">
        <Box className="!overflow-x-auto">
          <Table className={cn(dataTableClass, tableLastRowClass)}>
            <TableHead>
              <TableRow>
                <TableHeaderCell>Distributor</TableHeaderCell>
                <TableHeaderCell>Contact</TableHeaderCell>
                <TableHeaderCell>GSTIN / DL No.</TableHeaderCell>
                <TableHeaderCell>Payment terms</TableHeaderCell>
                <TableHeaderCell className={numClass}>Products</TableHeaderCell>
                <TableHeaderCell className={numClass}>Outstanding</TableHeaderCell>
                <TableHeaderCell>Status</TableHeaderCell>
                <TableHeaderCell></TableHeaderCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {filtered.map(renderFiltered)}
              {filtered.length === 0 && (
                <TableRow>
                  <TableCell colSpan={8}>
                    <Box className="!p-7 !text-center !text-muted">
                      <Box className="mx-auto mb-3 grid h-11 w-11 place-items-center rounded-xl bg-wash text-[21px] leading-none text-mid">
                        <IconTruck size={30} />
                      </Box>
                      <Text className="!text-[13px] !text-muted">
                        {q ? "No distributors match your search." : "No distributors added yet."}
                      </Text>
                    </Box>
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </Box>
      </Box>

      {(adding || edit) && (
        <DistributorModal
          init={edit ?? undefined}
          onClose={setAddingOnClose}
          onSave={updateSupplierOnSave}
        />
      )}
    </>
  );
  function matchSupplier(s: Supplier) {
    return (s.paymentTerms || "").toLowerCase().includes("credit");
  }
  function setQOnChange(e: ChangeEvent<HTMLInputElement>) {
    return setQ(e.target.value);
  }
  function setAddingOnClick() {
    return setAdding(true);
  }
  function renderFiltered(s: Supplier) {
    return (
      <TableRow key={s.id}>
        <TableCell>
          <Box className="flex items-center gap-2.5">
            <Text
              className={cn(
                "inline-grid h-[34px] w-[34px] shrink-0 place-items-center overflow-hidden rounded-[9px] bg-wash text-[17px] font-display font-bold leading-none text-mid",
                "!bg-wash !text-mid !grid !place-items-center",
              )}
              as="span"
            >
              <IconTruck size={18} />
            </Text>
            <Text as="span">
              <Text className="!text-[13px] !font-bold !text-ink" as="span">
                {s.name}
              </Text>
              <Box className="text-[11.5px] text-muted">
                {[s.city, s.state].filter(Boolean).join(", ") || "—"}
              </Box>
            </Text>
          </Box>
        </TableCell>
        <TableCell>
          <Box className={cn("!font-semibold")}>{s.contactPerson || "—"}</Box>
          <Box className={cn("text-[12.5px] text-muted !text-muted", "!text-[11.5px]")}>
            <IconPhone size={12} /> {s.phone}
          </Box>
          {s.email && (
            <Box
              className={cn(
                "text-[12.5px] text-muted !text-muted",
                "!flex !items-center !gap-1 !text-[11.5px]",
              )}
            >
              <IconMail size={12} /> {s.email}
            </Box>
          )}
        </TableCell>
        <TableCell className={cn("!font-mono", "!text-[12px]")}>
          {s.gstin || "—"}
          <Box className="!text-muted">{s.dlNo || "—"}</Box>
        </TableCell>
        <TableCell>{s.paymentTerms || "—"}</TableCell>
        <TableCell className={numClass}>
          <Text
            className="!inline-flex !items-center !gap-1 !rounded-full !bg-blue-bg !px-[9px] !py-[3px] !text-[11px] !font-bold !whitespace-nowrap !text-blue"
            as="span"
          >
            {prodCount[s.id] || 0}
          </Text>
        </TableCell>
        <TableCell
          className={cn(
            numClass,
            "!font-bold",
            (s.outstanding || 0) > 0 ? "!text-[#b4232a]" : "!text-mid",
          )}
        >
          {inr(s.outstanding || 0)}
        </TableCell>
        <TableCell>
          <Text
            className={`!inline-flex !items-center !gap-1 !whitespace-nowrap !rounded-full !px-[9px] !py-[3px] !text-[11px] !font-bold ${s.active !== false ? "!bg-wash !text-mid" : "!bg-gray-pill !text-muted"}`}
            as="span"
          >
            <Box className="inline-block h-1.5 w-1.5 shrink-0 rounded-full bg-current" />
            {s.active !== false ? "Active" : "Inactive"}
          </Text>
        </TableCell>
        <TableCell className={numClass}>
          <Box className="!flex !items-center !justify-end !gap-1.5">
            <IconButton label="Edit" title="Edit" onClick={setEditOnClick}>
              <IconEdit size={15} />
            </IconButton>
          </Box>
        </TableCell>
      </TableRow>
    );
    function setEditOnClick() {
      return setEdit(s);
    }
  }
  function setAddingOnClose() {
    setAdding(false);
    setEdit(null);
  }
  async function updateSupplierOnSave(data: Omit<Supplier, "id">) {
    const err = edit ? await updateSupplier(edit.id, data) : await addSupplier(data);
    if (!err) {
      setAdding(false);
      setEdit(null);
    }
  }
}
