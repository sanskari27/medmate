import { useMemo, useState } from "react";
import { ProductDialog } from "@/features/inventory";
import { problemMessage, useAuthState } from "@/features/authentication";
import { Box } from "@/components/ui/Box";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Text } from "@/components/ui/Text";
import { IconPrint, IconReports, IconStore } from "@/components/ui/Icon";
import { AssignLocations } from "../../components/AssignLocations";
import { LabelSheet } from "../../components/LabelSheet";
import { RackDialog } from "../../components/RackDialog";
import { RackMap } from "../../components/RackMap";
import { auditCsv, groupByLocation, racksAccess, unassignedProducts } from "../../model";
import {
  useBulkAssignMutation,
  useCreateRackMutation,
  useListRacksQuery,
  useSetLocationMutation,
} from "../../racks.api";

export function RacksPage() {
  const { session } = useAuthState();
  const access = racksAccess(session?.account.pharmacyRole, session?.account.permissions);
  const list = useListRacksQuery();
  const [createRack] = useCreateRackMutation();
  const [setLocation] = useSetLocationMutation();
  const [bulkAssign, bulkState] = useBulkAssignMutation();
  const [tab, setTab] = useState<"map" | "assign">("map");
  const [query, setQuery] = useState("");
  const [labels, setLabels] = useState(false);
  const [openRack, setOpenRack] = useState<string | null>(null);
  const [productId, setProductId] = useState<string | null>(null);
  const [dialogFault, setDialogFault] = useState("");
  const products = list.data?.products ?? [];
  const groups = useMemo(
    () => groupByLocation(list.data?.products ?? [], list.data?.racks ?? []),
    [list.data],
  );
  const unassigned = unassignedProducts(products);
  const zones = new Set(groups.map((group) => group.zone));
  const detail = openRack ? groups.find((group) => group.code === openRack) : null;
  const selected = products.find((product) => product.productId === productId) ?? null;

  async function place(id: string, rack: string) {
    try {
      await setLocation({ productId: id, rack }).unwrap();
      return null;
    } catch (error) {
      return problemMessage(error, "Could not set the location");
    }
  }

  if (list.isLoading) return <Text className="text-[13.5px] text-muted">Loading racks</Text>;
  if (list.isError) {
    return (
      <Text className="text-[13.5px] text-rose">
        {problemMessage(list.error, "Could not load racks")}
      </Text>
    );
  }

  return (
    <Box className="mx-auto max-w-[1680px]">
      <Box className="mb-[22px] grid gap-4 md:grid-cols-4">
        <Stat label="Racks created" value={String(groups.length)} hint="cupboards & shelves" />
        <Stat label="Racks / zones" value={String(zones.size)} hint="in use" />
        <Stat
          label="Medicines mapped"
          value={String(products.length - unassigned.length)}
          hint="with a location"
        />
        <Stat label="No location yet" value={String(unassigned.length)} hint="need allocating" />
      </Box>
      <Box className="mb-4 flex flex-wrap items-center gap-2.5">
        <Box className="inline-flex gap-0.5 rounded-sm border border-line bg-wash-2 p-0.5">
          <Button
            type="button"
            size="sm"
            variant={tab === "map" ? "primary" : "ghost"}
            className={tab === "map" ? undefined : "border-transparent bg-transparent shadow-none"}
            onClick={() => setTab("map")}
          >
            <IconStore size={14} /> Rack map
          </Button>
          <Button
            type="button"
            size="sm"
            variant={tab === "assign" ? "primary" : "ghost"}
            className={
              tab === "assign" ? undefined : "border-transparent bg-transparent shadow-none"
            }
            onClick={() => setTab("assign")}
          >
            Assign locations{unassigned.length ? ` · ${unassigned.length}` : ""}
          </Button>
        </Box>
        <Input
          aria-label="Search racks"
          placeholder="Search medicine or rack code (e.g. A3-12)…"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          className="min-w-[240px] flex-1"
        />
        {access.export ? (
          <Button
            type="button"
            variant="ghost"
            disabled={products.length === 0}
            onClick={() => download(auditCsv(products))}
          >
            <IconReports size={16} /> Audit Excel
          </Button>
        ) : null}
        <Button
          type="button"
          variant="ghost"
          disabled={groups.length === 0}
          onClick={() => setLabels(true)}
        >
          <IconPrint size={16} /> Print rack labels
        </Button>
      </Box>
      {tab === "map" ? (
        <RackMap
          groups={groups}
          query={query}
          unassigned={unassigned.length}
          canCreate={access.create}
          onCreate={async (code) => {
            try {
              await createRack({ rack: code }).unwrap();
              return null;
            } catch (error) {
              return problemMessage(error, "Could not add the rack");
            }
          }}
          onOpen={setOpenRack}
          onProduct={setProductId}
          onAssign={() => setTab("assign")}
        />
      ) : (
        <AssignLocations
          products={products}
          query={query}
          canUpdate={access.update}
          fault={
            bulkState.isError
              ? problemMessage(bulkState.error, "Could not assign the location")
              : ""
          }
          onSave={(id, rack) => place(id, rack)}
          onBulk={async (ids, rack) => {
            try {
              await bulkAssign({ ids, rack }).unwrap();
              return null;
            } catch (error) {
              return problemMessage(error, "Could not assign the location");
            }
          }}
        />
      )}
      {labels ? <LabelSheet groups={groups} onClose={() => setLabels(false)} /> : null}
      {detail ? (
        <RackDialog
          code={detail.code}
          items={detail.items}
          products={products}
          canUpdate={access.update}
          fault={dialogFault}
          onClose={() => {
            setOpenRack(null);
            setDialogFault("");
          }}
          onAdd={async (id) => {
            const problem = await place(id, detail.code);
            setDialogFault(problem ?? "");
          }}
          onProduct={setProductId}
        />
      ) : null}
      {selected ? (
        <ProductDialog
          product={selected}
          onClose={() => setProductId(null)}
          onLocationSaved={() => void list.refetch()}
        />
      ) : null}
    </Box>
  );
}

function Stat({ label, value, hint }: { label: string; value: string; hint: string }) {
  return (
    <Box className="rounded-md border border-line bg-paper px-[18px] py-4 shadow-sm">
      <Text className="text-[11px] font-bold tracking-[0.05em] text-muted uppercase">{label}</Text>
      <Text className="mt-[3px] font-display text-[26px] font-extrabold tracking-[-0.03em] text-dark">
        {value}
      </Text>
      <Text className="mt-auto border-t border-line pt-[9px] text-[12px] text-muted">{hint}</Text>
    </Box>
  );
}

function download(csv: string) {
  const blob = new Blob([`\uFEFF${csv}`], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = "rack-audit.csv";
  link.click();
  URL.revokeObjectURL(url);
}
