import { Box, Button, Heading, Input, Table, TableBody, TableCell, TableHead, TableHeaderCell, TableRow, Text } from "@/components/atoms";
import { cn } from "@/utils/className";
import type { ChangeEvent } from "react";
import { useMemo, useState } from "react";
import { usePharma } from "@/hooks";
import { Supplier, inr, allottedSupplierId } from "@/utils";
import { IconPlus, IconEdit, IconTruck, IconMail, IconBox, IconCard, IconUsers, IconPhone, } from "@/components/Icon";
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
        if (!q.trim())
            return true;
        const t = q.toLowerCase();
        return [s.name, s.gstin, s.phone, s.contactPerson, s.city, s.email]
            .filter(Boolean)
            .some((v) => v!.toLowerCase().includes(t));
    });
    return (<>
      <Box className="!mb-[22px] !grid !grid-cols-[repeat(auto-fit,minmax(min(100%,168px),1fr))] !gap-4">
        <Box className="group !relative !flex !flex-col !overflow-hidden !rounded-md !border !border-line !bg-paper !px-[18px] !py-4 !shadow-sm">
          <Box className="!grid !h-8 !w-8 !place-items-center !rounded-[9px] !text-[17px] !bg-blue-bg !text-blue">
            <IconTruck size={18}/>
          </Box>
          <Box className="!mt-3 !text-[11px] !font-bold !uppercase !tracking-[0.05em] !text-muted">Distributors</Box>
          <Box className="!mt-[3px] !mb-2.5 !font-display !text-[26px] !font-extrabold !tracking-tight !text-dark !tabular-nums">{suppliers.length}</Box>
          <Box className="mt-auto block border-t border-line pt-[9px] text-xs text-muted">{activeCount} active</Box>
        </Box>
        <Box className="group !relative !flex !flex-col !overflow-hidden !rounded-md !border !border-line !bg-paper !px-[18px] !py-4 !shadow-sm">
          <Box className="!grid !h-8 !w-8 !place-items-center !rounded-[9px] !text-[17px] !bg-wash !text-mid">
            <IconBox size={18}/>
          </Box>
          <Box className="!mt-3 !text-[11px] !font-bold !uppercase !tracking-[0.05em] !text-muted">Products sourced</Box>
          <Box className="!mt-[3px] !mb-2.5 !font-display !text-[26px] !font-extrabold !tracking-tight !text-dark !tabular-nums">{inventory.length}</Box>
          <Box className="mt-auto block border-t border-line pt-[9px] text-xs text-muted">across all suppliers</Box>
        </Box>
        <Box className="group !relative !flex !flex-col !overflow-hidden !rounded-md !border !border-line !bg-paper !px-[18px] !py-4 !shadow-sm">
          <Box className="!grid !h-8 !w-8 !place-items-center !rounded-[9px] !text-[17px] !bg-rose-bg !text-rose">
            <IconCard size={18}/>
          </Box>
          <Box className="!mt-3 !text-[11px] !font-bold !uppercase !tracking-[0.05em] !text-muted">Total outstanding</Box>
          <Box className="!mt-[3px] !mb-2.5 !font-display !text-[26px] !font-extrabold !tracking-tight !text-dark !tabular-nums">{inr(totalOutstanding)}</Box>
          <Box className="mt-auto block border-t border-line pt-[9px] text-xs text-muted">payable to distributors</Box>
        </Box>
        <Box className="group !relative !flex !flex-col !overflow-hidden !rounded-md !border !border-line !bg-paper !px-[18px] !py-4 !shadow-sm">
          <Box className="!grid !h-8 !w-8 !place-items-center !rounded-[9px] !text-[17px] !bg-amber-bg !text-gold-d">
            <IconUsers size={18}/>
          </Box>
          <Box className="!mt-3 !text-[11px] !font-bold !uppercase !tracking-[0.05em] !text-muted">On credit terms</Box>
          <Box className="!mt-[3px] !mb-2.5 !font-display !text-[26px] !font-extrabold !tracking-tight !text-dark !tabular-nums">
            {suppliers.filter(matchSupplier)
            .length}
          </Box>
          <Box className="mt-auto block border-t border-line pt-[9px] text-xs text-muted">credit accounts</Box>
        </Box>
      </Box>

      <Box className="!mb-4 !flex !flex-wrap !items-center !gap-2.5">
        <Heading className={cn("!text-[16px]")} level={2}>Distributor directory</Heading>
        <Box className="!flex-1"/>
        <Input placeholder="Search name, GSTIN, contact…" value={q} onChange={setQOnChange} className={cn("", "!max-w-[260px]")}/>
        <Button className="!border-transparent !bg-mid !text-white !shadow-sm hover:!bg-green" onClick={setAddingOnClick}>
          <IconPlus size={16}/> Add distributor
        </Button>
      </Box>

      <Box className="!flex !flex-col !rounded-md !border !border-line !bg-paper !shadow-sm">
        <Box className="!overflow-x-auto">
          <Table className="!w-full !border-separate !border-spacing-0 !text-[13px] [&_th]:!sticky [&_th]:!top-0 [&_th]:!border-b [&_th]:!border-line [&_th]:!bg-wash-2 [&_th]:!px-3.5 [&_th]:!py-[11px] [&_th]:!text-left [&_th]:!text-[10.5px] [&_th]:!font-bold [&_th]:!uppercase [&_th]:!tracking-[0.07em] [&_th]:!whitespace-nowrap [&_th]:!text-muted [&_td]:!border-b [&_td]:!border-line [&_td]:!px-3.5 [&_td]:!py-[11px] [&_td]:!align-middle [&_td]:!text-ink-2">
            <TableHead>
              <TableRow>
                <TableHeaderCell>Distributor</TableHeaderCell>
                <TableHeaderCell>Contact</TableHeaderCell>
                <TableHeaderCell>GSTIN / DL No.</TableHeaderCell>
                <TableHeaderCell>Payment terms</TableHeaderCell>
                <TableHeaderCell className="text-right tabular-nums font-semibold text-ink">Products</TableHeaderCell>
                <TableHeaderCell className="text-right tabular-nums font-semibold text-ink">Outstanding</TableHeaderCell>
                <TableHeaderCell>Status</TableHeaderCell>
                <TableHeaderCell></TableHeaderCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {filtered.map(renderFiltered)}
              {filtered.length === 0 && (<TableRow>
                  <TableCell colSpan={8}>
                    <Box className={cn("!px-5 !py-9 !text-center !text-muted [&_h3]:!mb-[5px] [&_h3]:!text-[15px] [&_h3]:!font-bold [&_h3]:!text-ink", "!p-7")}>
                      <Box className="mx-auto mb-3 grid h-11 w-11 place-items-center rounded-xl bg-wash text-[21px] leading-none text-mid">
                        <IconTruck size={30}/>
                      </Box>
                      <Text>
                        {q ? "No distributors match your search." : "No distributors added yet."}
                      </Text>
                    </Box>
                  </TableCell>
                </TableRow>)}
            </TableBody>
          </Table>
        </Box>
      </Box>

      {(adding || edit) && (<DistributorModal init={edit ?? undefined} onClose={setAddingOnClose} onSave={updateSupplierOnSave}/>)}
    </>);
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
        return (<TableRow key={s.id}>
                  <TableCell>
                    <Box className="flex items-center gap-2.5">
                      <Text className={cn("inline-grid h-[34px] w-[34px] shrink-0 place-items-center overflow-hidden rounded-[9px] bg-wash text-[17px] font-display font-bold leading-none text-mid", "!bg-wash !text-mid !grid !place-items-center")} as="span">
                        <IconTruck size={18}/>
                      </Text>
                      <Text as="span">
                        <Text className="!font-bold !text-ink" as="span">{s.name}</Text>
                        <Box className="text-[11.5px] text-muted">
                          {[s.city, s.state].filter(Boolean).join(", ") || "—"}
                        </Box>
                      </Text>
                    </Box>
                  </TableCell>
                  <TableCell>
                    <Box className={cn("!font-semibold")}>{s.contactPerson || "—"}</Box>
                    <Box className={cn("text-[12.5px] text-muted !text-muted", "!text-[11.5px]")}>
                      <IconPhone size={12}/> {s.phone}
                    </Box>
                    {s.email && (<Box className={cn("text-[12.5px] text-muted !text-muted", "!flex !items-center !gap-1 !text-[11.5px]")}>
                        <IconMail size={12}/> {s.email}
                      </Box>)}
                  </TableCell>
                  <TableCell className={cn("!font-mono", "!text-[12px]")}>
                    {s.gstin || "—"}
                    <Box className="!text-muted">{s.dlNo || "—"}</Box>
                  </TableCell>
                  <TableCell>{s.paymentTerms || "—"}</TableCell>
                  <TableCell className="text-right tabular-nums font-semibold text-ink">
                    <Text className="!inline-flex !items-center !gap-1 !whitespace-nowrap !rounded-full !px-[9px] !py-[3px] !text-[11px] !font-bold !bg-blue-bg !text-blue" as="span">{prodCount[s.id] || 0}</Text>
                  </TableCell>
                  <TableCell className={cn("text-right tabular-nums font-semibold text-ink", "!font-bold", (s.outstanding || 0) > 0 ? "!text-rose" : "!text-mid")}>
                    {inr(s.outstanding || 0)}
                  </TableCell>
                  <TableCell>
                    <Text className={`!inline-flex !items-center !gap-1 !whitespace-nowrap !rounded-full !px-[9px] !py-[3px] !text-[11px] !font-bold ${s.active !== false ?"!bg-wash !text-mid" :"!bg-gray-pill !text-muted"}`} as="span">
                      <Box className="inline-block h-1.5 w-1.5 shrink-0 rounded-full bg-current" />
                      {s.active !== false ? "Active" : "Inactive"}
                    </Text>
                  </TableCell>
                  <TableCell className="text-right tabular-nums font-semibold text-ink">
                    <Box className={cn("!flex !items-center !gap-1.5", "!justify-end")}>
                      <Button className="!grid !h-8 !w-8 !place-items-center !rounded-xs !border !border-line-2 !bg-paper !text-ink-2 hover:!bg-wash-2 hover:!text-mid" title="Edit" onClick={setEditOnClick}>
                        <IconEdit size={15}/>
                      </Button>
                    </Box>
                  </TableCell>
                </TableRow>);
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
